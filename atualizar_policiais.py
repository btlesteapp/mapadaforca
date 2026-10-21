import openpyxl
import json
import os
import re

excel_path = os.path.join(os.path.dirname(__file__), 'src/data/gerador_sql_supabase.xlsx')
policiais_js_path = os.path.join(os.path.dirname(__file__), 'src/data/policiais.js')

print(f"Lendo planilha: {excel_path}")
wb = openpyxl.load_workbook(excel_path, data_only=True)
sheet = wb.active
rows = list(sheet.iter_rows(values_only=True))

headers = [str(h).strip() if h is not None else '' for h in rows[0]]
print(f"Colunas encontradas: {headers}")

# Identificar os índices das colunas
def find_col(possible_names):
    for i, h in enumerate(headers):
        if h.lower() in [n.lower() for n in possible_names]:
            return i
    return -1

id_idx = find_col(['id', 'Id', 'ID'])
rg_idx = find_col(['rg', 'Rg', 'RG', 'matricula'])
nome_idx = find_col(['nome', 'Nome', 'NOME'])
ng_idx = find_col(['nome_guerra', 'nomeGuerra', 'Nome de Guerra', 'NOME_GUERRA'])
pg_idx = find_col(['p/g', 'P/G', 'posto_grad', 'postoGrad', 'Posto/Graduação', 'POSTO_GRAD'])

print(f"Indices: Id={id_idx}, Rg={rg_idx}, Nome={nome_idx}, NomeGuerra={ng_idx}, PostoGrad={pg_idx}")

# Carregar policiais atuais de policiais.js para comparação
old_policiais = []
if os.path.exists(policiais_js_path):
    with open(policiais_js_path, 'r', encoding='utf-8') as f:
        content = f.read()
    match = re.search(r'export const POLICIAIS = (\[[\s\S]*?\]);', content)
    if match:
        old_policiais = json.loads(match.group(1))

old_by_rg = {str(p.get('rg', '')).strip(): p for p in old_policiais if p.get('rg')}
print(f"Efetivo anterior em policiais.js: {len(old_policiais)} registros")

# Processar novos policiais da planilha
novos_policiais = []
rgs_processados = set()
duplicados = []

for row_num, r in enumerate(rows[1:], start=2):
    # Pular linhas totalmente vazias
    if not any(r):
        continue

    val_id = r[id_idx] if id_idx != -1 and r[id_idx] is not None else None
    val_rg = str(r[rg_idx]).strip() if rg_idx != -1 and r[rg_idx] is not None else ''
    val_nome = str(r[nome_idx]).strip() if nome_idx != -1 and r[nome_idx] is not None else ''
    val_ng = str(r[ng_idx]).strip() if ng_idx != -1 and r[ng_idx] is not None else ''
    val_pg = str(r[pg_idx]).strip() if pg_idx != -1 and r[pg_idx] is not None else ''

    # Limpar RG se tiver .0 vindo do Excel
    if val_rg.endswith('.0'):
        val_rg = val_rg[:-2]

    # Se não tiver RG nem Nome, pular
    if not val_rg and not val_nome:
        continue

    # Tratar duplicações de RG
    if val_rg in rgs_processados:
        duplicados.append((val_rg, val_nome, row_num))
    rgs_processados.add(val_rg)

    # Converter ID para int se numérico
    if val_id is not None:
        try:
            val_id = int(val_id)
        except (ValueError, TypeError):
            pass

    # Custom overrides solicitados para nomes de guerra:
    OVERRIDES_NG = {
        '19520': 'R. SILVA',
        '23361': 'G. MARTINS',
        '23156': 'MICHEL SILVA',
        '26068': 'WILLIAMS',
        '26843': 'RAISSA FREIRE'
    }
    if val_rg in OVERRIDES_NG:
        val_ng = OVERRIDES_NG[val_rg]

    item = {
        "id": val_id,
        "rg": val_rg,
        "nome": val_nome,
        "nomeGuerra": val_ng,
        "postoGrad": val_pg
    }
    novos_policiais.append(item)

print(f"Novo efetivo lido da planilha: {len(novos_policiais)} registros")
if duplicados:
    print(f"Atenção: {len(duplicados)} RGs duplicados encontrados na planilha: {duplicados}")

new_by_rg = {p['rg']: p for p in novos_policiais if p['rg']}

# Comparação detalhada
saíram = [old_by_rg[rg] for rg in old_by_rg if rg not in new_by_rg]
entraram = [new_by_rg[rg] for rg in new_by_rg if rg not in old_by_rg]

alterados_nome_guerra = []
alterados_posto = []
alterados_nome = []

for rg, novo in new_by_rg.items():
    if rg in old_by_rg:
        antigo = old_by_rg[rg]
        if antigo.get('nomeGuerra', '').strip() != novo.get('nomeGuerra', '').strip():
            alterados_nome_guerra.append({
                'rg': rg,
                'nome': novo['nome'],
                'antigo_ng': antigo.get('nomeGuerra', ''),
                'novo_ng': novo['nomeGuerra']
            })
        if antigo.get('postoGrad', '').strip() != novo.get('postoGrad', '').strip():
            alterados_posto.append({
                'rg': rg,
                'nome': novo['nome'],
                'antigo_pg': antigo.get('postoGrad', ''),
                'novo_pg': novo['postoGrad']
            })
        if antigo.get('nome', '').strip() != novo.get('nome', '').strip():
            alterados_nome.append({
                'rg': rg,
                'antigo_nome': antigo.get('nome', ''),
                'novo_nome': novo['nome']
            })

print("\n--- RESUMO DA COMPARAÇÃO ---")
print(f"Total anterior: {len(old_policiais)}")
print(f"Total atualizado: {len(novos_policiais)}")
print(f"Policiais que saíram: {len(saíram)}")
print(f"Policiais novos que entraram: {len(entraram)}")
print(f"Nomes de guerra atualizados: {len(alterados_nome_guerra)}")
print(f"Postos/Graduações promovidos/atualizados: {len(alterados_posto)}")
print(f"Nomes corrigidos: {len(alterados_nome)}")

# Salvar relatório em JSON para uso e auditoria
relatorio = {
    "total_anterior": len(old_policiais),
    "total_novo": len(novos_policiais),
    "sairam": saíram,
    "entraram": entraram,
    "alterados_nome_guerra": alterados_nome_guerra,
    "alterados_posto": alterados_posto,
    "alterados_nome": alterados_nome
}

with open('scratch_comparacao.json', 'w', encoding='utf-8') as f:
    json.dump(relatorio, f, ensure_ascii=False, indent=2)

# Gerar novo policiais.js
output_content = f"""// Arquivo gerado automaticamente a partir de gerador_sql_supabase.xlsx
// Total de registros: {len(novos_policiais)}
export const POLICIAIS = {json.dumps(novos_policiais, ensure_ascii=False, indent=2)};
"""

with open(policiais_js_path, 'w', encoding='utf-8') as f:
    f.write(output_content)

print(f"\n[SUCESSO] {policiais_js_path} foi atualizado com sucesso com {len(novos_policiais)} registros!")
