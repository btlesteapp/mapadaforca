import { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { 
  Shield, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  FileText, 
  Download, 
  Copy, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  FileCheck,
  MapPin,
  TrendingUp,
  Users,
  Plus,
  Upload,
  RefreshCw,
  AlertOctagon,
  FileSpreadsheet
} from 'lucide-react';
import './App.css';
import { POLICIAIS } from './data/policiais.js';

// Pre-defined units for occurrences (includes BTL LESTE and SEG)
const OCCURRENCE_UNITS = [
  { id: 'btl-leste', name: 'BTL LESTE' },
  { id: '4-cicom', name: '4ª CICOM' },
  { id: '9-cicom', name: '9ª CICOM' },
  { id: '11-cicom', name: '11ª CICOM' },
  { id: '14-cicom', name: '14ª CICOM' },
  { id: '25-cicom', name: '25ª CICOM' },
  { id: '28-cicom', name: '28ª CICOM' },
  { id: '29-cicom', name: '29ª CICOM' },
  { id: '30-cicom', name: '30ª CICOM' },
  { id: 'seg', name: 'SEG' }
];

// Initial state for the 9 units in Mapa da Forca
const INITIAL_UNITS = [
  { id: 'cpa-leste', name: 'CPA LESTE', shortName: 'LESTE', isHQ: true, supervisor: '', supervisorId: '', vtrOrd: 0, vtrSeg: 0, pmOrd: 0, pmSeg: 0 },
  { id: '4-cicom', name: '04ª CICOM', shortName: '4ª', isHQ: false, supervisor: '', supervisorId: '', vtrOrd: 0, vtrSeg: 0, pmOrd: 0, pmSeg: 0 },
  { id: '9-cicom', name: '09ª CICOM', shortName: '9ª', isHQ: false, supervisor: '', supervisorId: '', vtrOrd: 0, vtrSeg: 0, pmOrd: 0, pmSeg: 0 },
  { id: '11-cicom', name: '11ª CICOM', shortName: '11ª', isHQ: false, supervisor: '', supervisorId: '', vtrOrd: 0, vtrSeg: 0, pmOrd: 0, pmSeg: 0 },
  { id: '14-cicom', name: '14ª CICOM', shortName: '14ª', isHQ: false, supervisor: '', supervisorId: '', vtrOrd: 0, vtrSeg: 0, pmOrd: 0, pmSeg: 0 },
  { id: '25-cicom', name: '25ª CICOM', shortName: '25ª', isHQ: false, supervisor: '', supervisorId: '', vtrOrd: 0, vtrSeg: 0, pmOrd: 0, pmSeg: 0 },
  { id: '28-cicom', name: '28ª CICOM', shortName: '28ª', isHQ: false, supervisor: '', supervisorId: '', vtrOrd: 0, vtrSeg: 0, pmOrd: 0, pmSeg: 0 },
  { id: '29-cicom', name: '29ª CICOM', shortName: '29ª', isHQ: false, supervisor: '', supervisorId: '', vtrOrd: 0, vtrSeg: 0, pmOrd: 0, pmSeg: 0 },
  { id: '30-cicom', name: '30ª CICOM', shortName: '30ª', isHQ: false, supervisor: '', supervisorId: '', vtrOrd: 0, vtrSeg: 0, pmOrd: 0, pmSeg: 0 }
];

const INITIAL_HEADER = {
  data: new Date().toISOString().split('T')[0],
  hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  turno: '1º TURNO',
  customTurno: '',
  cpoNome: '',
  cpoId: '',
  telefone: ''
};

// Common nature suggestions for quick entry
const NATURE_SUGGESTIONS = [
  'Homicídio',
  'Roubo',
  'Furto',
  'Morte por Intervenção policial',
  'Tráfico de Drogas',
  'Apreensão de Arma de Fogo',
  'Apreensão de Entorpecentes',
  'Veículo Recuperado',
  'Lesão Corporal'
];

// Utility to pad values to two digits (defined globally)
const formatNum = (val) => {
  const num = parseInt(val, 10);
  if (isNaN(num)) return '00';
  return num < 10 ? `0${num}` : `${num}`;
};

// Component: Numeric Cell Input with zero-padding (outside App scope)
const NumericCell = ({ value, onChange }) => {
  const [prevValue, setPrevValue] = useState(value);
  const [localVal, setLocalVal] = useState(formatNum(value));

  if (value !== prevValue) {
    setPrevValue(value);
    setLocalVal(formatNum(value));
  }

  const handleChange = (e) => {
    let val = e.target.value.replace(/\D/g, ''); 
    if (val.length > 2) val = val.slice(-2);     
    setLocalVal(val);
    const parsed = parseInt(val, 10);
    onChange(isNaN(parsed) ? 0 : parsed);
  };

  const handleBlur = () => {
    setLocalVal(formatNum(value));
  };

  const handleFocus = (e) => {
    e.target.select();
  };

  return (
    <input
      type="text"
      value={localVal}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      className="w-14 px-1 py-1 text-sm rounded border border-slate-300 text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-800 bg-white"
    />
  );
};

// Component: Dynamic Incident List Field in Mapa (outside App scope)
const IncidentListField = ({ label, items, placeholder, onAdd, onChange, onRemove }) => {
  return (
    <div className="flex flex-col gap-3 bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{label}</label>
        <button
          type="button"
          onClick={onAdd}
          className="text-[11px] px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow-sm hover:shadow-md transition-all flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Adicionar
        </button>
      </div>
      <div className="flex flex-col gap-2 mt-1">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              type="text"
              placeholder={placeholder}
              value={item}
              onChange={(e) => onChange(idx, e.target.value)}
              className="w-full text-slate-800 bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-3 py-1.5 text-sm outline-none transition-all"
            />
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const normalizeRank = (rank) => (rank || '').toUpperCase().replace(/°/g, 'º').trim();

const isAllowedSA = (rank) => {
  return normalizeRank(rank) === 'CAP QOPM';
};

const isAllowedSSA = (rank) => {
  const r = normalizeRank(rank);
  const allowed = [
    'ASP OF PM',
    'ASP OF',
    '1º TEN QOPM',
    '1º TEN QOAPM',
    '1º TEN QPPM',
    '1° TEN QPPM',
    '2º TEN QOPM',
    '2º TEN QOAPM',
    '1º SGT QPPM',
    '2º SGT QPPM',
    '3º SGT QPPM'
  ];
  return allowed.includes(r);
};

function App() {
  // Navigation Tab State
  const [activeTab, setActiveTab] = useState('mapa'); // 'mapa' or 'ocorrencias'

  // Header shared operational data
  const [header, setHeader] = useState(() => {
    const saved = localStorage.getItem('mf_header');
    return saved ? JSON.parse(saved) : INITIAL_HEADER;
  });

  // Mapa da Força Table State
  const [units, setUnits] = useState(() => {
    const saved = localStorage.getItem('mf_units');
    return saved ? JSON.parse(saved) : INITIAL_UNITS;
  });

  // Mapa da Força Alterations states
  const [faltas, setFaltas] = useState(() => {
    const saved = localStorage.getItem('mf_faltas');
    return saved ? JSON.parse(saved) : ['S/A'];
  });

  const [atrasos, setAtrasos] = useState(() => {
    const saved = localStorage.getItem('mf_atrasos');
    return saved ? JSON.parse(saved) : ['S/A'];
  });

  const [dispensas, setDispensas] = useState(() => {
    const saved = localStorage.getItem('mf_dispensas');
    return saved ? JSON.parse(saved) : ['S/A'];
  });

  // Resumo de Ocorrencias State
  // Each unit stores an array of occurrences: { nature: '', ciops: '', bo: '', ciopsInProg: false, boInProg: false }
  const [occurrences, setOccurrences] = useState(() => {
    const saved = localStorage.getItem('mf_occurrences');
    if (saved) return JSON.parse(saved);
    const initial = {};
    OCCURRENCE_UNITS.forEach(u => {
      initial[u.id] = [];
    });
    return initial;
  });

  // PWA customized logo URL
  const [logoUrl, setLogoUrl] = useState(() => {
    return localStorage.getItem('mf_logo') || 'logo.png';
  });

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showOccClearConfirm, setShowOccClearConfirm] = useState(false);
  const fileInputRef = useRef(null);

  // Sync states to local storage
  useEffect(() => {
    localStorage.setItem('mf_header', JSON.stringify(header));
  }, [header]);

  useEffect(() => {
    localStorage.setItem('mf_units', JSON.stringify(units));
  }, [units]);

  useEffect(() => {
    localStorage.setItem('mf_faltas', JSON.stringify(faltas));
  }, [faltas]);

  useEffect(() => {
    localStorage.setItem('mf_atrasos', JSON.stringify(atrasos));
  }, [atrasos]);

  useEffect(() => {
    localStorage.setItem('mf_dispensas', JSON.stringify(dispensas));
  }, [dispensas]);

  useEffect(() => {
    localStorage.setItem('mf_occurrences', JSON.stringify(occurrences));
  }, [occurrences]);

  // Toast notifier helper
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast({ visible: false, message: '', type: 'success' });
    }, 3000);
  };

  const formatDateBR = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const formatHourBR = (timeStr) => {
    if (!timeStr) return '';
    if (timeStr.includes(':')) {
      const parts = timeStr.split(':');
      return `${parts[0]}h${parts[1]}`;
    }
    return timeStr;
  };

  // Phone input mask
  const handlePhoneChange = (e) => {
    let value = e.target.value;
    value = value.replace(/\D/g, "");
    if (value.length > 0) {
      if (value.length <= 2) {
        value = `(${value}`;
      } else if (value.length <= 7) {
        value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
      } else {
        value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
      }
    }
    setHeader(prev => ({ ...prev, telefone: value }));
  };

  // Custom logo upload
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result;
        setLogoUrl(base64Data);
        localStorage.setItem('mf_logo', base64Data);
        showToast('Logo atualizada com sucesso!');
      };
      reader.readAsDataURL(file);
    }
  };

  const resetLogo = () => {
    setLogoUrl('logo.png');
    localStorage.removeItem('mf_logo');
    showToast('Logo redefinida para a padrão.');
  };

  const handleCpoIdChange = (idValue) => {
    setHeader(prev => {
      const newHeader = { ...prev, cpoId: idValue };
      const cleanId = idValue.toString().trim();
      const p = POLICIAIS.find(x => x.rg.toString().trim() === cleanId);
      if (p) {
        if (isAllowedSA(p.postoGrad)) {
          newHeader.cpoNome = `${p.postoGrad} ${p.nomeGuerra}`;
        } else {
          showToast(`O policial ${p.nomeGuerra} (${p.postoGrad}) não pode ser SA Leste. Apenas CAP QOPM é permitido.`, 'error');
          newHeader.cpoNome = '';
        }
      } else if (cleanId === '') {
        newHeader.cpoNome = '';
      }
      return newHeader;
    });
  };

  // Table value change triggers (Mapa da Força)
  const handleUnitChange = (id, field, value) => {
    setUnits(prev => prev.map(u => {
      if (u.id === id) {
        if (['vtrOrd', 'vtrSeg', 'pmOrd', 'pmSeg'].includes(field)) {
          const parsed = parseInt(value, 10);
          return { ...u, [field]: isNaN(parsed) ? 0 : parsed };
        }
        
        let newUnit = { ...u, [field]: value };
        
        if (field === 'supervisorId') {
          const cleanId = value.toString().trim();
          const p = POLICIAIS.find(x => x.rg.toString().trim() === cleanId);
          if (p) {
            if (isAllowedSSA(p.postoGrad)) {
              newUnit.supervisor = `${p.postoGrad} ${p.nomeGuerra}`;
            } else {
              showToast(`O policial ${p.nomeGuerra} (${p.postoGrad}) não pode ser SSA. Postos permitidos: ASP OF PM, TEN ou SGT.`, 'error');
              newUnit.supervisor = '';
            }
          } else if (cleanId === '') {
            newUnit.supervisor = '';
          }
        }
        
        return newUnit;
      }
      return u;
    }));
  };

  // Incident field arrays helpers (Mapa da Força)
  const handleAddIncidentItem = (category) => {
    if (category === 'faltas') setFaltas([...faltas, '']);
    if (category === 'atrasos') setAtrasos([...atrasos, '']);
    if (category === 'dispensas') setDispensas([...dispensas, '']);
  };

  const handleRemoveIncidentItem = (category, index) => {
    let list = category === 'faltas' ? faltas : category === 'atrasos' ? atrasos : dispensas;
    const newList = list.filter((_, i) => i !== index);
    const finalized = newList.length === 0 ? ['S/A'] : newList;
    
    if (category === 'faltas') setFaltas(finalized);
    if (category === 'atrasos') setAtrasos(finalized);
    if (category === 'dispensas') setDispensas(finalized);
  };

  const handleIncidentItemChange = (category, index, value) => {
    let list = [...(category === 'faltas' ? faltas : category === 'atrasos' ? atrasos : dispensas)];
    list[index] = value;
    if (category === 'faltas') setFaltas(list);
    if (category === 'atrasos') setAtrasos(list);
    if (category === 'dispensas') setDispensas(list);
  };

  // Resets all state of Mapa da Força
  const handleClearAll = () => {
    setHeader({
      data: new Date().toISOString().split('T')[0],
      hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      turno: '1º TURNO',
      customTurno: '',
      cpoNome: '',
      cpoId: '',
      telefone: ''
    });
    setUnits(INITIAL_UNITS);
    setFaltas(['S/A']);
    setAtrasos(['S/A']);
    setDispensas(['S/A']);
    setLogoUrl('logo.png');
    localStorage.removeItem('mf_logo');
    setShowClearConfirm(false);
    showToast('Formulário limpo com sucesso!', 'info');
  };

  // Resets all state of occurrences
  const handleClearOccurrences = () => {
    const cleared = {};
    OCCURRENCE_UNITS.forEach(u => {
      cleared[u.id] = [];
    });
    setOccurrences(cleared);
    setShowOccClearConfirm(false);
    showToast('Todas as ocorrências foram limpas.', 'info');
  };

  // Occurrence State Changers
  const handleAddOccurrence = (unitId) => {
    setOccurrences(prev => ({
      ...prev,
      [unitId]: [
        ...(prev[unitId] || []),
        { nature: '', ciops: '', bo: '', ciopsInProg: false, boInProg: false }
      ]
    }));
  };

  const handleRemoveOccurrence = (unitId, index) => {
    setOccurrences(prev => ({
      ...prev,
      [unitId]: (prev[unitId] || []).filter((_, i) => i !== index)
    }));
  };

  const handleOccurrenceFieldChange = (unitId, index, field, value) => {
    setOccurrences(prev => {
      const list = [...(prev[unitId] || [])];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, [unitId]: list };
    });
  };

  const getTurnoText = () => {
    if (header.turno === 'OUTRO') {
      return (header.customTurno || 'OUTRO TURNO').toUpperCase();
    }
    return header.turno;
  };

  // ----------------------------------------------------
  // REPORT 1: MAPA DA FORÇA GENERATORS (TXT & PDF)
  // ----------------------------------------------------

  const totalVtrOrd = units.reduce((acc, c) => acc + c.vtrOrd, 0);
  const totalVtrSeg = units.reduce((acc, c) => acc + c.vtrSeg, 0);
  const grandTotalViaturas = totalVtrOrd + totalVtrSeg;

  const totalPmOrd = units.reduce((acc, c) => acc + c.pmOrd, 0);
  const totalPmSeg = units.reduce((acc, c) => acc + c.pmSeg, 0);
  const grandTotalEfetivo = totalPmOrd + totalPmSeg;

  const formatIncidentText = (arr) => {
    const filtered = arr.map(i => i.trim()).filter(i => i !== '' && i.toUpperCase() !== 'S/A');
    if (filtered.length === 0) return 'S/A';
    return filtered.join(', ');
  };

  const generateTXTString = () => {
    const dateFormatted = formatDateBR(header.data);
    const timeFormatted = formatHourBR(header.hora);
    const turnoText = getTurnoText();

    const lines = [];
    lines.push('MAPA DA FORÇA');
    lines.push(`*BATALHÃO LESTE - ${dateFormatted}* ${timeFormatted}`);
    lines.push(`*${turnoText}*`);
    lines.push('');
    lines.push(`*SA LESTE: ${header.cpoNome.toUpperCase().trim() || 'SEM IDENTIFICAÇÃO'} (${header.cpoId.trim() || 'N/C'})*`);
    lines.push(`*TEL: ${header.telefone || 'N/I'}.*`);
    lines.push('');
    lines.push('SUPERVISORES DE SUBÁREAS');
    
    units.forEach(u => {
      if (!u.isHQ) {
        const nameVal = u.supervisor ? u.supervisor.toUpperCase().trim() : 'S/A';
        const idVal = u.supervisorId ? ` (${u.supervisorId.trim()})` : '';
        lines.push(`*SSA ${u.shortName} : ${nameVal}${idVal}*`);
      }
    });
    
    lines.push('------------------------------------------');
    lines.push('*VIATURAS MONTADAS*');
    lines.push('');
    
    units.forEach(u => {
      const vtrTotal = u.vtrOrd + u.vtrSeg;
      const paddedTotal = formatNum(vtrTotal);
      
      if (u.vtrSeg > 0) {
        lines.push(`${u.name} : ${paddedTotal} (ORD ${formatNum(u.vtrOrd)} + SEG ${formatNum(u.vtrSeg)})`);
      } else {
        lines.push(`${u.name} : ${paddedTotal}`);
      }
    });
    
    lines.push('__________________________________________');
    lines.push('');
    lines.push(`TOTAL GERAL DE VIATURAS: ${grandTotalViaturas}`);
    lines.push('__________________________________________');
    lines.push('');
    lines.push('*EFETIVO*');
    lines.push('');
    
    units.forEach(u => {
      const pmTotal = u.pmOrd + u.pmSeg;
      const paddedTotal = formatNum(pmTotal);
      
      if (u.pmSeg > 0) {
        lines.push(`${u.name} : ${paddedTotal} (ORD ${formatNum(u.pmOrd)} + SEG ${formatNum(u.pmSeg)})`);
      } else {
        lines.push(`${u.name} : ${paddedTotal}`);
      }
    });
    
    lines.push('__________________________________________');
    lines.push('');
    lines.push(`TOTAL GERAL PM's: ${grandTotalEfetivo}`);
    lines.push('');
    lines.push(`*FALTAS: ${formatIncidentText(faltas)}*`);
    lines.push(`*ATRASOS: ${formatIncidentText(atrasos)}*`);
    lines.push(`*DISPENSAS: ${formatIncidentText(dispensas)}*`);
    lines.push('');
    lines.push('*BOM SERVIÇO A TODOS!*');

    return lines.join('\n');
  };

  const handleGeneratePDF = async () => {
    showToast('Gerando documento PDF...', 'info');
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const navyDark = [8, 12, 24];
      const navyBlue = [27, 38, 79];
      const textDark = [30, 41, 59];
      const grayLight = [248, 250, 252];
      const borderGray = [226, 232, 240];

      // A4 page boundaries
      doc.setDrawColor(...navyBlue);
      doc.setLineWidth(0.4);
      doc.rect(6, 6, 198, 285); 

      // Header Banner
      doc.setFillColor(...navyDark);
      doc.rect(6, 6, 198, 24, 'F');
      
      if (logoUrl) {
        try {
          doc.addImage(logoUrl, 'PNG', 12, 8, 16, 20);
        } catch (logoErr) {
          console.warn("Could not insert logo image into PDF.", logoErr);
        }
      }

      // Center-aligned Header Texts
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("POLÍCIA MILITAR DO AMAZONAS", 105, 12, { align: "center" });
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.text("BATALHÃO LESTE - BTL LESTE", 105, 17, { align: "center" });
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(245, 176, 65);
      doc.text("MAPA DA FORÇA", 105, 22, { align: "center" });

      // Metadata Header Info
      doc.setTextColor(...textDark);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("INFORMAÇÕES OPERACIONAIS DO SERVIÇO", 12, 38);
      
      doc.setDrawColor(...borderGray);
      doc.setLineWidth(0.2);
      doc.line(12, 40, 198, 40);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      
      doc.text(`Data: ${formatDateBR(header.data)}`, 12, 45);
      doc.text(`Hora do Registro: ${header.hora}`, 12, 50);
      doc.text(`Turno Operacional: ${getTurnoText()}`, 12, 55);

      const saNameText = header.cpoNome ? header.cpoNome.toUpperCase() : 'SEM IDENTIFICAÇÃO';
      const saIdText = header.cpoId ? header.cpoId : 'N/C';
      doc.text(`Supervisor de Área (SA Leste): ${saNameText}`, 85, 45);
      doc.text(`Matrícula / ID: ${saIdText}`, 85, 50);
      doc.text(`Telefone de Plantão: ${header.telefone || 'N/I'}`, 85, 55);

      // Main Data Table Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("DISTRIBUIÇÃO DE EFETIVO ORDINÁRIO E SEG POR CICOM", 12, 65);
      doc.line(12, 67, 198, 67);

      const tableYStart = 71;
      const colX = {
        unidade: 12,      
        supervisor: 35,  
        id: 78,          
        vtrOrd: 93,      
        vtrSeg: 110,     
        vtrTotal: 127,   
        pmOrd: 144,      
        pmSeg: 161,      
        pmTotal: 178     
      };

      doc.setFillColor(...navyBlue);
      doc.rect(12, tableYStart, 186, 7, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.text("UNIDADE", colX.unidade + 2, tableYStart + 4.5);
      doc.text("SUPERVISOR (SSA)", colX.supervisor + 2, tableYStart + 4.5);
      doc.text("ID", colX.id + 2, tableYStart + 4.5);
      doc.text("VTR ORD", colX.vtrOrd + 8.5, tableYStart + 4.5, { align: "center" });
      doc.text("VTR SEG", colX.vtrSeg + 8.5, tableYStart + 4.5, { align: "center" });
      doc.text("VTR TOT", colX.vtrTotal + 8.5, tableYStart + 4.5, { align: "center" });
      doc.text("PM ORD", colX.pmOrd + 8.5, tableYStart + 4.5, { align: "center" });
      doc.text("PM SEG", colX.pmSeg + 8.5, tableYStart + 4.5, { align: "center" });
      doc.text("PM TOT", colX.pmTotal + 10, tableYStart + 4.5, { align: "center" });

      let currentY = tableYStart + 7;
      doc.setTextColor(...textDark);

      units.forEach((u, idx) => {
        if (idx % 2 === 1) {
          doc.setFillColor(...grayLight);
          doc.rect(12, currentY, 186, 6.5, 'F');
        }
        
        doc.setDrawColor(...borderGray);
        doc.line(12, currentY + 6.5, 198, currentY + 6.5);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);

        let nameField = u.supervisor;
        let idField = u.supervisorId;
        if (u.isHQ) {
          nameField = header.cpoNome;
          idField = header.cpoId;
        }

        const supervisorDisplay = u.isHQ ? 'SA LESTE (CPO)' : (nameField ? nameField.toUpperCase() : 'S/A');
        const idDisplay = idField || '-';

        doc.text(u.name, colX.unidade + 2, currentY + 4.5);
        doc.text(supervisorDisplay, colX.supervisor + 2, currentY + 4.5);
        doc.text(idDisplay, colX.id + 2, currentY + 4.5);
        
        // Centered numeric column output
        doc.text(formatNum(u.vtrOrd), colX.vtrOrd + 8.5, currentY + 4.5, { align: "center" });
        doc.text(formatNum(u.vtrSeg), colX.vtrSeg + 8.5, currentY + 4.5, { align: "center" });
        
        doc.setFont("helvetica", "bold");
        doc.text(formatNum(u.vtrOrd + u.vtrSeg), colX.vtrTotal + 8.5, currentY + 4.5, { align: "center" });
        
        doc.setFont("helvetica", "normal");
        doc.text(formatNum(u.pmOrd), colX.pmOrd + 8.5, currentY + 4.5, { align: "center" });
        doc.text(formatNum(u.pmSeg), colX.pmSeg + 8.5, currentY + 4.5, { align: "center" });
        
        doc.setFont("helvetica", "bold");
        doc.text(formatNum(u.pmOrd + u.pmSeg), colX.pmTotal + 10, currentY + 4.5, { align: "center" });

        currentY += 6.5;
      });

      // Total Geral Row inside PDF Table
      doc.setFillColor(230, 235, 245);
      doc.rect(12, currentY, 186, 7.5, 'F');
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("TOTAL GERAL", colX.unidade + 2, currentY + 5);
      
      doc.text(formatNum(totalVtrOrd), colX.vtrOrd + 8.5, currentY + 5, { align: "center" });
      doc.text(formatNum(totalVtrSeg), colX.vtrSeg + 8.5, currentY + 5, { align: "center" });
      
      doc.setTextColor(220, 140, 20); 
      doc.text(formatNum(grandTotalViaturas), colX.vtrTotal + 8.5, currentY + 5, { align: "center" });
      doc.setTextColor(...textDark);
      
      doc.text(formatNum(totalPmOrd), colX.pmOrd + 8.5, currentY + 5, { align: "center" });
      doc.text(formatNum(totalPmSeg), colX.pmSeg + 8.5, currentY + 5, { align: "center" });
      
      doc.setTextColor(220, 140, 20);
      doc.text(formatNum(grandTotalEfetivo), colX.pmTotal + 10, currentY + 5, { align: "center" });
      doc.setTextColor(...textDark);

      // Table Outline
      doc.setDrawColor(...navyBlue);
      doc.setLineWidth(0.3);
      doc.rect(12, tableYStart, 186, currentY - tableYStart + 7.5);

      currentY += 15;

      // Incidents Operational events
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("ALTERAÇÕES E EVENTUALIDADES OPERACIONAIS", 12, currentY);
      doc.line(12, currentY + 2, 198, currentY + 2);
      
      currentY += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(`Faltas de Efetivo: ${formatIncidentText(faltas)}`, 14, currentY);
      doc.text(`Atrasos Registrados: ${formatIncidentText(atrasos)}`, 14, currentY + 5.5);
      doc.text(`Dispensas Justificadas: ${formatIncidentText(dispensas)}`, 14, currentY + 11);

      // SIGNATURE LINES REMOVED as requested by user

      // Footer message
      currentY += 30;
      doc.setFont("helvetica", "bolditalic");
      doc.setFontSize(9);
      doc.setTextColor(...navyBlue);
      doc.text("* BOM SERVIÇO A TODOS! *", 82, currentY);

      const fileDate = header.data ? header.data.replace(/-/g, '_') : 'data';
      doc.save(`MAPA_DA_FORCA_${fileDate}.pdf`);
      showToast('Relatório PDF exportado com sucesso!');
    } catch (e) {
      console.error(e);
      showToast('Erro ao exportar relatório em PDF.', 'error');
    }
  };

  const handleCopyToClipboard = () => {
    try {
      const text = generateTXTString();
      navigator.clipboard.writeText(text);
      showToast('Mapa da Força copiado para a área de transferência!');
    } catch (err) {
      console.error(err);
      showToast('Falha ao copiar mapa.', 'error');
    }
  };

  const handleDownloadTXT = () => {
    try {
      const text = generateTXTString();
      const element = document.createElement("a");
      const file = new Blob([text], {type: 'text/plain;charset=utf-8'});
      element.href = URL.createObjectURL(file);
      const dateFormatted = header.data ? header.data.replace(/-/g, '_') : 'mapa';
      element.download = `MAPA_DA_FORCA_${dateFormatted}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      showToast('TXT do mapa baixado com sucesso!');
    } catch (err) {
      console.error(err);
      showToast('Erro ao baixar TXT do mapa.', 'error');
    }
  };

  // ----------------------------------------------------
  // REPORT 2: RESUMO DE OCORRÊNCIAS GENERATORS (TXT & PDF)
  // ----------------------------------------------------

  const formatSingleOccurrence = (occ) => {
    const nature = occ.nature.trim() || 'Ocorrência de relevo';
    const ciopsVal = occ.ciopsInProg ? 'Ocorrência em Andamento, aguardando numeral' : occ.ciops.trim();
    const boVal = occ.boInProg ? 'Ocorrência em Andamento, aguardando numeral' : occ.bo.trim();
    
    let result = `• ${nature}`;
    
    if (ciopsVal && boVal) {
      result += `, Nº CIOPS: ${ciopsVal}. Nº BO: ${boVal}`;
    } else if (ciopsVal) {
      result += `, Nº CIOPS: ${ciopsVal}`;
    } else if (boVal) {
      result += `, Nº BO: ${boVal}`;
    }
    
    // Ensure it ends with a period
    if (!result.endsWith('.')) {
      result += '.';
    }
    return result;
  };

  const generateOccurrencesTXTString = () => {
    const dateFormatted = formatDateBR(header.data);
    const timeFormatted = formatHourBR(header.hora);
    const turnoText = getTurnoText();

    const lines = [];
    lines.push('*POLÍCIA MILITAR DO AMAZONAS*');
    lines.push('*BATALHÃO LESTE*');
    lines.push('');
    lines.push('*RESUMO DE OCORRÊNCIAS*');
    lines.push(`*${dateFormatted} - ${turnoText}* ${timeFormatted}`);
    lines.push(`*SA LESTE: ${header.cpoNome.toUpperCase().trim() || 'SEM IDENTIFICAÇÃO'}*`);
    lines.push('');
    
    OCCURRENCE_UNITS.forEach(unit => {
      lines.push(`*${unit.name}:*`);
      const list = occurrences[unit.id] || [];
      const activeOccs = list.filter(o => o.nature.trim() !== '');
      
      if (activeOccs.length === 0) {
        lines.push('Sem ocorrência de grande vulto.');
      } else {
        activeOccs.forEach(o => {
          lines.push(formatSingleOccurrence(o));
        });
      }
    });
    
    lines.push('');
    lines.push('*BOA FOLGA E BOM SERVIÇO A TODOS*');
    lines.push('');
    lines.push('*BATALHÃO LESTE: CONQUISTAR E MANTER*');

    return lines.join('\n');
  };

  const handleCopyToClipboardOcc = () => {
    try {
      const text = generateOccurrencesTXTString();
      navigator.clipboard.writeText(text);
      showToast('Resumo de ocorrências copiado!');
    } catch (err) {
      console.error(err);
      showToast('Falha ao copiar resumo.', 'error');
    }
  };

  const handleDownloadOccTXT = () => {
    try {
      const text = generateOccurrencesTXTString();
      const element = document.createElement("a");
      const file = new Blob([text], {type: 'text/plain;charset=utf-8'});
      element.href = URL.createObjectURL(file);
      const dateFormatted = header.data ? header.data.replace(/-/g, '_') : 'ocorrencias';
      element.download = `RESUMO_DE_OCORRENCIAS_${dateFormatted}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      showToast('TXT de ocorrências baixado com sucesso!');
    } catch (err) {
      console.error(err);
      showToast('Erro ao baixar TXT de ocorrências.', 'error');
    }
  };

  // Compile PDF document for occurrences
  const handleGenerateOccurrencesPDF = async () => {
    showToast('Gerando PDF de ocorrências...', 'info');
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const navyDark = [8, 12, 24];
      const navyBlue = [27, 38, 79];
      const textDark = [30, 41, 59];
      const borderGray = [226, 232, 240];

      // Margem e borda
      doc.setDrawColor(...navyBlue);
      doc.setLineWidth(0.4);
      doc.rect(6, 6, 198, 285); 

      // Header Banner
      doc.setFillColor(...navyDark);
      doc.rect(6, 6, 198, 24, 'F');
      
      if (logoUrl) {
        try {
          doc.addImage(logoUrl, 'PNG', 12, 8, 16, 20);
        } catch (logoErr) {
          console.warn("Could not insert logo image into PDF.", logoErr);
        }
      }

      // Center-aligned Header Texts
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("POLÍCIA MILITAR DO AMAZONAS", 105, 12, { align: "center" });
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.text("BATALHÃO LESTE - BTL LESTE", 105, 17, { align: "center" });
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(245, 176, 65);
      doc.text("RESUMO DE OCORRÊNCIAS", 105, 22, { align: "center" });

      // Metadata Header Info
      doc.setTextColor(...textDark);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("INFORMAÇÕES OPERACIONAIS DO SERVIÇO", 12, 38);
      
      doc.setDrawColor(...borderGray);
      doc.setLineWidth(0.2);
      doc.line(12, 40, 198, 40);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      
      doc.text(`Data: ${formatDateBR(header.data)}`, 12, 45);
      doc.text(`Hora do Registro: ${header.hora}`, 12, 50);
      doc.text(`Turno Operacional: ${getTurnoText()}`, 12, 55);

      const saNameText = header.cpoNome ? header.cpoNome.toUpperCase() : 'SEM IDENTIFICAÇÃO';
      const saIdText = header.cpoId ? header.cpoId : 'N/C';
      doc.text(`Supervisor de Área (SA Leste): ${saNameText}`, 85, 45);
      doc.text(`Matrícula / ID: ${saIdText}`, 85, 50);
      doc.text(`Telefone de Plantão: ${header.telefone || 'N/I'}`, 85, 55);

      // Section title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("RESUMO OPERACIONAL DE OCORRÊNCIAS DE RELEVO", 12, 65);
      doc.line(12, 67, 198, 67);

      let currentY = 72;
      doc.setTextColor(...textDark);

      OCCURRENCE_UNITS.forEach(unit => {
        // Prevent drawing off page bounds
        if (currentY > 265) {
          doc.addPage();
          doc.setDrawColor(...navyBlue);
          doc.setLineWidth(0.4);
          doc.rect(6, 6, 198, 285);
          currentY = 15;
        }

        // Draw Unit Title Header Banner
        doc.setFillColor(240, 244, 248);
        doc.rect(12, currentY, 186, 5.5, 'F');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...navyDark);
        doc.text(`${unit.name}`, 14, currentY + 4);

        currentY += 5.5;

        // Draw occurrences under unit
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(...textDark);

        const list = occurrences[unit.id] || [];
        const activeOccs = list.filter(o => o.nature.trim() !== '');

        if (activeOccs.length === 0) {
          doc.text("Sem ocorrência de grande vulto.", 16, currentY + 4.5);
          currentY += 6.5;
        } else {
          activeOccs.forEach(o => {
            if (currentY > 270) {
              doc.addPage();
              doc.setDrawColor(...navyBlue);
              doc.setLineWidth(0.4);
              doc.rect(6, 6, 198, 285);
              currentY = 15;
            }
            
            const formatted = formatSingleOccurrence(o);
            const splitText = doc.splitTextToSize(formatted, 178); // wrap cleanly
            doc.text(splitText, 16, currentY + 4.5);
            currentY += (splitText.length * 4) + 1.5;
          });
        }
        
        currentY += 1.5; 
      });

      // Spacing for footers
      currentY += 8;
      if (currentY > 270) {
        doc.addPage();
        doc.setDrawColor(...navyBlue);
        doc.setLineWidth(0.4);
        doc.rect(6, 6, 198, 285);
        currentY = 15;
      }

      // Center-aligned footer messages
      doc.setFont("helvetica", "bolditalic");
      doc.setFontSize(9);
      doc.setTextColor(...navyBlue);
      doc.text("* BOA FOLGA E BOM SERVIÇO A TODOS *", 105, currentY, { align: "center" });
      doc.text("* BATALHÃO LESTE: CONQUISTAR E MANTER *", 105, currentY + 5, { align: "center" });

      const fileDate = header.data ? header.data.replace(/-/g, '_') : 'data';
      doc.save(`RESUMO_DE_OCORRENCIAS_${fileDate}.pdf`);
      showToast('PDF de ocorrências exportado com sucesso!');
    } catch (e) {
      console.error(e);
      showToast('Erro ao exportar resumo em PDF.', 'error');
    }
  };

  return (
    <div className="min-h-screen pb-12 bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Toast de Notificação */}
      {toast.visible && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border border-blue-500/20 bg-white animate-bounce glow-accent">
          <CheckCircle2 className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-semibold text-slate-800">{toast.message}</span>
        </div>
      )}

      {/* Main Header Area - Dark Navy Banner */}
      <header className="relative w-full py-8 bg-[#080c18] border-b border-slate-800 overflow-hidden text-white">
        <div className="absolute inset-0 bg-radial-at-t from-[#1b264f]/30 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="flex items-center gap-5">
            {/* Customizable Logo */}
            <div className="relative group p-1 bg-white/10 rounded-xl border border-white/20 shadow-inner overflow-hidden">
              <img src={logoUrl} className="w-16 h-16 object-contain rounded" alt="CPA Leste Logo" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                <button 
                  onClick={() => fileInputRef.current.click()} 
                  className="p-1 bg-blue-600 rounded text-white hover:bg-blue-700 cursor-pointer"
                  title="Upload Logo"
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>
                {logoUrl !== 'logo.png' && (
                  <button 
                    onClick={resetLogo} 
                    className="p-1 bg-rose-600 rounded text-white hover:bg-rose-700 cursor-pointer"
                    title="Redefinir Logo"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <input 
                ref={fileInputRef} 
                type="file" 
                accept="image/*" 
                onChange={handleLogoUpload} 
                className="hidden" 
              />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded">PMAM</span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-amber-500/20 border border-amber-500/50 text-amber-400 rounded">CPA LESTE</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1">MAPA DA FORÇA</h1>
              <p className="text-xs md:text-sm text-slate-400 font-medium">Controle Operacional Integrado do Batalhão Leste</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs - Switch between Mapa and Resumo de Ocorrencias */}
      <nav className="max-w-7xl mx-auto px-6 mt-6 flex border-b border-slate-200 w-full">
        <button
          onClick={() => setActiveTab('mapa')}
          className={`px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${activeTab === 'mapa' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <Shield className="w-4 h-4" />
          Mapa da Força
        </button>
        <button
          onClick={() => setActiveTab('ocorrencias')}
          className={`px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${activeTab === 'ocorrencias' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <FileText className="w-4 h-4" />
          Resumo de Ocorrências
        </button>
      </nav>

      {/* Shared Operational Header (Visible in both tabs) */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-6 w-full">
        <section className="glass-panel p-6 rounded-2xl glow-accent">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6">
            <FileCheck className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800 tracking-wide uppercase">Identificação Operacional</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-505 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" /> Data
              </label>
              <input
                type="date"
                value={header.data}
                onChange={(e) => setHeader(prev => ({ ...prev, data: e.target.value }))}
                className="glass-input px-3 py-2 text-sm rounded-lg"
              />
            </div>
            
            {/* Time */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-505 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" /> Hora
              </label>
              <input
                type="time"
                value={header.hora}
                onChange={(e) => setHeader(prev => ({ ...prev, hora: e.target.value }))}
                className="glass-input px-3 py-2 text-sm rounded-lg"
              />
            </div>

            {/* Shift */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-505 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" /> Turno
              </label>
              <select
                value={header.turno}
                onChange={(e) => setHeader(prev => ({ ...prev, turno: e.target.value }))}
                className="glass-input px-3 py-2 text-sm rounded-lg cursor-pointer"
              >
                <option value="1º TURNO">1º TURNO</option>
                <option value="2º TURNO">2º TURNO</option>
                <option value="3º TURNO">3º TURNO</option>
                <option value="OUTRO">OUTRO TURNO</option>
              </select>
            </div>

            {/* Custom Shift */}
            {header.turno === 'OUTRO' ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-505 uppercase tracking-wider">
                  Especificar Turno
                </label>
                <input
                  type="text"
                  placeholder="Ex: Turno Especial"
                  value={header.customTurno}
                  onChange={(e) => setHeader(prev => ({ ...prev, customTurno: e.target.value }))}
                  className="glass-input px-3 py-2 text-sm rounded-lg placeholder-slate-400"
                />
              </div>
            ) : (
              <div className="hidden lg:block lg:col-span-0" />
            )}

            {/* CPO / SA Name */}
            <div className="flex flex-col gap-1.5 lg:col-span-2">
              <label className="text-xs font-semibold text-slate-505 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" /> Supervisor Geral (SA Leste)
              </label>
              <input
                type="text"
                placeholder="Nome de Guerra (Ex: CAP ROGER)"
                value={header.cpoNome}
                onChange={(e) => setHeader(prev => ({ ...prev, cpoNome: e.target.value }))}
                className="glass-input px-3 py-2 text-sm rounded-lg placeholder-slate-400"
              />
            </div>

            {/* CPO ID */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-505 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-600" /> ID / Matrícula
              </label>
              <input
                type="text"
                placeholder="Ex: 20805"
                value={header.cpoId}
                onChange={(e) => handleCpoIdChange(e.target.value)}
                className="glass-input px-3 py-2 text-sm rounded-lg placeholder-slate-400"
              />
            </div>

            {/* Telephone */}
            <div className="flex flex-col gap-1.5 lg:col-span-2">
              <label className="text-xs font-semibold text-slate-505 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-600" /> Telefone de Plantão
              </label>
              <input
                type="text"
                placeholder="(92) 98842-2842"
                value={header.telefone}
                onChange={handlePhoneChange}
                className="glass-input px-3 py-2 text-sm rounded-lg placeholder-slate-400"
                maxLength={15}
              />
            </div>
          </div>
        </section>
      </div>

      {/* Main Content Area - Toggle tabs */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-6 flex-grow w-full flex flex-col gap-8">
        
        {/* ========================================================================= */}
        {/* SCREEN 1: MAPA DA FORÇA                                                   */}
        {/* ========================================================================= */}
        {activeTab === 'mapa' && (
          <>
            {/* Running KPIs Totals */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-amber-600 shadow-sm">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Viaturas Montadas</span>
                  <span className="text-3xl font-black text-slate-800 mt-1 block">{formatNum(grandTotalViaturas)}</span>
                </div>
                <div className="p-3 rounded-lg bg-amber-500/10 text-amber-700">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>

              <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-blue-600 shadow-sm">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Efetivo de Serviço</span>
                  <span className="text-3xl font-black text-slate-800 mt-1 block">{formatNum(grandTotalEfetivo)} PMs</span>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/10 text-blue-700">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-slate-500 shadow-sm">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Subáreas Cobertas</span>
                  <span className="text-3xl font-black text-slate-800 mt-1 block">08 Unidades</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-100 text-slate-505">
                  <MapPin className="w-6 h-6" />
                </div>
              </div>

              <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-emerald-500 shadow-sm">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Conexão Local</span>
                  <span className="text-lg font-bold text-emerald-600 mt-1 block">Operação Offline OK</span>
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>
            </section>

            {/* Interactive Grid Table */}
            <section className="glass-panel rounded-2xl overflow-hidden shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-slate-800 tracking-wide uppercase">Distribuição por Unidade</h2>
                </div>
                <span className="text-xs font-medium text-slate-505 italic">Preenchimento de Efetivos & Meios</span>
              </div>

              {/* Desktop Table View */}
              <div className="overflow-x-auto hidden md:block">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#1b264f] text-white text-xs font-bold uppercase tracking-wider border-b border-slate-350">
                      <th className="py-3.5 px-4 w-[14%] border-r border-white/5">UNIDADE</th>
                      <th className="py-3.5 px-4 w-[24%] border-r border-white/5">SUPERVISOR (SSA)</th>
                      <th className="py-3.5 px-4 w-[11%] border-r border-white/5">ID</th>
                      <th className="py-3.5 px-4 w-[8%] text-center border-r border-white/5">VTR ORD</th>
                      <th className="py-3.5 px-4 w-[8%] text-center border-r border-white/5">VTR SEG</th>
                      <th className="py-3.5 px-4 w-[9%] text-center border-r border-white/5 font-bold">VTR TOT</th>
                      <th className="py-3.5 px-4 w-[8%] text-center border-r border-white/5">PM ORD</th>
                      <th className="py-3.5 px-4 w-[8%] text-center border-r border-white/5">PM SEG</th>
                      <th className="py-3.5 px-4 w-[10%] text-center font-bold">PM TOT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700 text-sm">
                    {units.map((unit, idx) => {
                      const vtrTotal = unit.vtrOrd + unit.vtrSeg;
                      const pmTotal = unit.pmOrd + unit.pmSeg;
                      
                      return (
                        <tr 
                          key={unit.id} 
                          className={`hover:bg-slate-50/70 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'} ${unit.isHQ ? 'bg-blue-50/20 font-semibold' : ''}`}
                        >
                          <td className="py-2.5 px-4 font-bold text-slate-800 border-r border-slate-100">
                            {unit.name}
                          </td>

                          <td className="py-2.5 px-4 border-r border-slate-100">
                            <input
                              type="text"
                              placeholder={unit.isHQ ? "SA LESTE (CPO)" : "Nome de Guerra"}
                              value={unit.isHQ ? (header.cpoNome ? `${header.cpoNome.toUpperCase()} (CPO)` : 'SA LESTE (CPO)') : unit.supervisor}
                              onChange={(e) => handleUnitChange(unit.id, 'supervisor', e.target.value)}
                              disabled={unit.isHQ}
                              className={`w-full px-3 py-1.5 text-xs rounded border outline-none transition-all ${unit.isHQ ? 'bg-slate-100 text-slate-500 font-bold border-slate-200 cursor-not-allowed' : 'border-slate-350 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-800'}`}
                            />
                          </td>

                          <td className="py-2.5 px-4 border-r border-slate-100">
                            <input
                              type="text"
                              placeholder="ID"
                              value={unit.isHQ ? header.cpoId : unit.supervisorId}
                              onChange={(e) => handleUnitChange(unit.id, 'supervisorId', e.target.value)}
                              disabled={unit.isHQ}
                              className={`w-full px-3 py-1.5 text-xs rounded border text-center outline-none transition-all ${unit.isHQ ? 'bg-slate-100 text-slate-500 font-bold border-slate-200 cursor-not-allowed' : 'border-slate-350 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-800'}`}
                            />
                          </td>

                          <td className="py-2.5 px-4 text-center border-r border-slate-100">
                            <NumericCell value={unit.vtrOrd} onChange={(val) => handleUnitChange(unit.id, 'vtrOrd', val)} />
                          </td>

                          <td className="py-2.5 px-4 text-center border-r border-slate-100">
                            <NumericCell value={unit.vtrSeg} onChange={(val) => handleUnitChange(unit.id, 'vtrSeg', val)} />
                          </td>

                          <td className="py-2.5 px-4 text-center text-sm font-extrabold text-slate-900 bg-slate-50/40 border-r border-slate-100">
                            {formatNum(vtrTotal)}
                          </td>

                          <td className="py-2.5 px-4 text-center border-r border-slate-100">
                            <NumericCell value={unit.pmOrd} onChange={(val) => handleUnitChange(unit.id, 'pmOrd', val)} />
                          </td>

                          <td className="py-2.5 px-4 text-center border-r border-slate-100">
                            <NumericCell value={unit.pmSeg} onChange={(val) => handleUnitChange(unit.id, 'pmSeg', val)} />
                          </td>

                          <td className="py-2.5 px-4 text-center text-sm font-extrabold text-slate-900 bg-slate-50/40">
                            {formatNum(pmTotal)}
                          </td>
                        </tr>
                      );
                    })}

                    {/* TOTAL GERAL ROW */}
                    <tr className="bg-slate-100 border-t border-slate-300 font-black text-slate-900">
                      <td className="py-3 px-4 text-sm" colSpan={3}>TOTAL GERAL</td>
                      <td className="py-3 px-4 text-center text-sm">{formatNum(totalVtrOrd)}</td>
                      <td className="py-3 px-4 text-center text-sm">{formatNum(totalVtrSeg)}</td>
                      <td className="py-3 px-4 text-center text-sm text-amber-600 font-black">{formatNum(grandTotalViaturas)}</td>
                      <td className="py-3 px-4 text-center text-sm">{formatNum(totalPmOrd)}</td>
                      <td className="py-3 px-4 text-center text-sm">{formatNum(totalPmSeg)}</td>
                      <td className="py-3 px-4 text-center text-sm text-amber-600 font-black">{formatNum(grandTotalEfetivo)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="grid grid-cols-1 gap-6 p-4 md:hidden">
                {units.map((unit) => {
                  const vtrTotal = unit.vtrOrd + unit.vtrSeg;
                  const pmTotal = unit.pmOrd + unit.pmSeg;

                  return (
                    <div 
                      key={unit.id}
                      className={`p-4 rounded-xl border flex flex-col gap-4 ${unit.isHQ ? 'bg-blue-50/30 border-blue-200' : 'bg-white border-slate-200'}`}
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                          {unit.isHQ && <Shield className="w-4 h-4 text-blue-600" />}
                          {unit.name}
                        </span>
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                          {unit.isHQ ? 'QG Batalhão' : 'Subárea'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-slate-505 uppercase">Supervisor</label>
                          <input
                            type="text"
                            value={unit.isHQ ? (header.cpoNome ? `${header.cpoNome.toUpperCase()} (CPO)` : 'SA LESTE (CPO)') : unit.supervisor}
                            onChange={(e) => handleUnitChange(unit.id, 'supervisor', e.target.value)}
                            disabled={unit.isHQ}
                            className={`px-3 py-1.5 text-xs rounded border outline-none ${unit.isHQ ? 'bg-slate-100 text-slate-505 font-bold border-slate-200 cursor-not-allowed' : 'border-slate-350 focus:border-blue-500 bg-white text-slate-800'}`}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-slate-505 uppercase">ID / Matrícula</label>
                          <input
                            type="text"
                            value={unit.isHQ ? header.cpoId : unit.supervisorId}
                            onChange={(e) => handleUnitChange(unit.id, 'supervisorId', e.target.value)}
                            disabled={unit.isHQ}
                            className={`px-3 py-1.5 text-xs rounded border text-center outline-none ${unit.isHQ ? 'bg-slate-100 text-slate-505 border-slate-200 cursor-not-allowed' : 'border-slate-350 focus:border-blue-500 bg-white text-slate-800'}`}
                          />
                        </div>
                      </div>

                      {/* Viaturas */}
                      <div className="p-3 bg-slate-50 border border-slate-150 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Viaturas (VTRs)</span>
                          <span className="text-xs font-black text-slate-800">Total: {formatNum(vtrTotal)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1 items-center">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">ORD</label>
                            <NumericCell value={unit.vtrOrd} onChange={(val) => handleUnitChange(unit.id, 'vtrOrd', val)} />
                          </div>
                          <div className="flex flex-col gap-1 items-center">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">SEG</label>
                            <NumericCell value={unit.vtrSeg} onChange={(val) => handleUnitChange(unit.id, 'vtrSeg', val)} />
                          </div>
                        </div>
                      </div>

                      {/* Efetivo */}
                      <div className="p-3 bg-slate-50 border border-slate-150 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Efetivo (PMs)</span>
                          <span className="text-xs font-black text-slate-800">Total: {formatNum(pmTotal)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1 items-center">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">ORD</label>
                            <NumericCell value={unit.pmOrd} onChange={(val) => handleUnitChange(unit.id, 'pmOrd', val)} />
                          </div>
                          <div className="flex flex-col gap-1 items-center">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">SEG</label>
                            <NumericCell value={unit.pmSeg} onChange={(val) => handleUnitChange(unit.id, 'pmSeg', val)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Incidents / Alterations Section */}
            <section className="glass-panel p-6 rounded-2xl glow-accent">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6">
                <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
                <h2 className="text-lg font-bold text-slate-800 tracking-wide uppercase">Alterações / Ocorrências de Serviço</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <IncidentListField 
                  label="Faltas de Efetivo (Ex: Nome/ID)" 
                  items={faltas} 
                  placeholder="SD LEANDRO GUEDES (25888)"
                  onAdd={() => handleAddIncidentItem('faltas')}
                  onChange={(idx, val) => handleIncidentItemChange('faltas', idx, val)}
                  onRemove={(idx) => handleRemoveIncidentItem('faltas', idx)}
                />
                <IncidentListField 
                  label="Atrasos de Serviço" 
                  items={atrasos} 
                  placeholder="Ex: SD SILVA (12345) - 20min"
                  onAdd={() => handleAddIncidentItem('atrasos')}
                  onChange={(idx, val) => handleIncidentItemChange('atrasos', idx, val)}
                  onRemove={(idx) => handleRemoveIncidentItem('atrasos', idx)}
                />
                <IncidentListField 
                  label="Dispensas do Turno" 
                  items={dispensas} 
                  placeholder="Ex: CB COSTA (54321) - Médica"
                  onAdd={() => handleAddIncidentItem('dispensas')}
                  onChange={(idx, val) => handleIncidentItemChange('dispensas', idx, val)}
                  onRemove={(idx) => handleRemoveIncidentItem('dispensas', idx)}
                />
              </div>
            </section>

            {/* Tab 1 Actions Panel */}
            <section className="flex flex-col sm:flex-row flex-wrap gap-4 items-center justify-center p-6 rounded-2xl bg-slate-100 border border-slate-200 glass-panel">
              <button
                onClick={handleCopyToClipboard}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 font-bold uppercase tracking-wider text-xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                Copiar Texto TXT
              </button>

              <button
                onClick={handleDownloadTXT}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 font-bold uppercase tracking-wider text-xs rounded-xl bg-white hover:bg-slate-50 text-blue-600 border border-slate-350 hover:border-blue-400 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Baixar Relatório TXT
              </button>

              <button
                onClick={handleGeneratePDF}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 font-bold uppercase tracking-wider text-xs rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                Gerar Relatório PDF
              </button>

              <button
                onClick={() => setShowClearConfirm(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 font-bold uppercase tracking-wider text-xs rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 hover:border-rose-300 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Limpar Dados
              </button>
            </section>
          </>
        )}

        {/* ========================================================================= */}
        {/* SCREEN 2: RESUMO DE OCORRÊNCIAS                                           */}
        {/* ========================================================================= */}
        {activeTab === 'ocorrencias' && (
          <>
            {/* Occurrences Main Editor Form */}
            <section className="glass-panel p-6 rounded-2xl glow-accent">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-6">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-slate-800 tracking-wide uppercase">Lançamento de Ocorrências por Unidade</h2>
                </div>
                <span className="text-xs font-semibold text-slate-505 italic">Sem ocorrências exibirá "Sem ocorrência de grande vulto."</span>
              </div>

              <div className="flex flex-col gap-6">
                {OCCURRENCE_UNITS.map((unit) => {
                  const list = occurrences[unit.id] || [];
                  const activeCount = list.filter(o => o.nature.trim() !== '').length;

                  return (
                    <div 
                      key={unit.id}
                      className="border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:border-slate-300 transition-all bg-white"
                    >
                      {/* Unit Title Banner inside occurrences panel */}
                      <div className="bg-slate-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-slate-800 text-sm tracking-wide">{unit.name}</span>
                          {activeCount === 0 ? (
                            <span className="px-2 py-0.5 text-[9px] font-bold text-slate-500 bg-slate-200 rounded uppercase">Sem ocorrência</span>
                          ) : (
                            <span className="px-2 py-0.5 text-[9px] font-bold text-blue-600 bg-blue-100 rounded uppercase">
                              {activeCount} Ocorrência{activeCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddOccurrence(unit.id)}
                          className="self-start sm:self-auto text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Adicionar Ocorrência
                        </button>
                      </div>

                      {/* List of Occurrence Inputs */}
                      <div className="p-4 flex flex-col gap-4">
                        {list.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">Nenhuma ocorrência registrada. O relatório exibirá "Sem ocorrência de grande vulto."</p>
                        ) : (
                          <div className="flex flex-col gap-4 divide-y divide-slate-100">
                            {list.map((occ, idx) => (
                              <div 
                                key={idx} 
                                className={`pt-4 first:pt-0 flex flex-col gap-4 relative ${list.length > 1 ? 'pr-8' : ''}`}
                              >
                                {/* Remove button for occurrence */}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOccurrence(unit.id, idx)}
                                  className="absolute top-2 right-0 p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                  title="Remover Ocorrência"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>

                                {/* Form Inputs Row */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {/* Natureza */}
                                  <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Natureza / Descrição</label>
                                    <input
                                      type="text"
                                      placeholder="Ex: Furto, Homicídio, Roubo..."
                                      value={occ.nature}
                                      onChange={(e) => handleOccurrenceFieldChange(unit.id, idx, 'nature', e.target.value)}
                                      className="glass-input px-3 py-2 text-xs rounded-lg"
                                      list={`natures-${unit.id}-${idx}`}
                                    />
                                    {/* DataList for Quick Suggestions */}
                                    <datalist id={`natures-${unit.id}-${idx}`}>
                                      {NATURE_SUGGESTIONS.map(s => <option key={s} value={s} />)}
                                    </datalist>
                                  </div>

                                  {/* CIOPS */}
                                  <div className="flex flex-col gap-1.5">
                                    <div className="flex justify-between items-center">
                                      <label className="text-[10px] font-bold text-slate-500 uppercase">Nº CIOPS</label>
                                      <label className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 cursor-pointer">
                                        <input 
                                          type="checkbox"
                                          checked={occ.ciopsInProg}
                                          onChange={(e) => {
                                            handleOccurrenceFieldChange(unit.id, idx, 'ciopsInProg', e.target.checked);
                                            if (e.target.checked) {
                                              handleOccurrenceFieldChange(unit.id, idx, 'ciops', 'Ocorrência em Andamento, aguardando numeral');
                                            } else {
                                              handleOccurrenceFieldChange(unit.id, idx, 'ciops', '');
                                            }
                                          }}
                                          className="rounded text-blue-600 focus:ring-blue-500 h-3 w-3 cursor-pointer"
                                        />
                                        Em andamento
                                      </label>
                                    </div>
                                    <input
                                      type="text"
                                      placeholder={occ.ciopsInProg ? "Ocorrência em Andamento..." : "Ex: 2256485"}
                                      value={occ.ciopsInProg ? 'Ocorrência em Andamento, aguardando numeral' : occ.ciops}
                                      onChange={(e) => handleOccurrenceFieldChange(unit.id, idx, 'ciops', e.target.value)}
                                      disabled={occ.ciopsInProg}
                                      className={`glass-input px-3 py-2 text-xs rounded-lg ${occ.ciopsInProg ? 'glass-input-disabled font-semibold text-slate-400 bg-slate-50' : ''}`}
                                    />
                                  </div>

                                  {/* BO */}
                                  <div className="flex flex-col gap-1.5">
                                    <div className="flex justify-between items-center">
                                      <label className="text-[10px] font-bold text-slate-500 uppercase">Nº BO</label>
                                      <label className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 cursor-pointer">
                                        <input 
                                          type="checkbox"
                                          checked={occ.boInProg}
                                          onChange={(e) => {
                                            handleOccurrenceFieldChange(unit.id, idx, 'boInProg', e.target.checked);
                                            if (e.target.checked) {
                                              handleOccurrenceFieldChange(unit.id, idx, 'bo', 'Ocorrência em Andamento, aguardando numeral');
                                            } else {
                                              handleOccurrenceFieldChange(unit.id, idx, 'bo', '');
                                            }
                                          }}
                                          className="rounded text-blue-600 focus:ring-blue-500 h-3 w-3 cursor-pointer"
                                        />
                                        Em andamento
                                      </label>
                                    </div>
                                    <input
                                      type="text"
                                      placeholder={occ.boInProg ? "Ocorrência em Andamento..." : "Ex: 00169636/2026"}
                                      value={occ.boInProg ? 'Ocorrência em Andamento, aguardando numeral' : occ.bo}
                                      onChange={(e) => handleOccurrenceFieldChange(unit.id, idx, 'bo', e.target.value)}
                                      disabled={occ.boInProg}
                                      className={`glass-input px-3 py-2 text-xs rounded-lg ${occ.boInProg ? 'glass-input-disabled font-semibold text-slate-400 bg-slate-50' : ''}`}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Tab 2 Actions Panel */}
            <section className="flex flex-col sm:flex-row flex-wrap gap-4 items-center justify-center p-6 rounded-2xl bg-slate-100 border border-slate-200 glass-panel">
              <button
                onClick={handleCopyToClipboardOcc}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 font-bold uppercase tracking-wider text-xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                Copiar Resumo TXT
              </button>

              <button
                onClick={handleDownloadOccTXT}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 font-bold uppercase tracking-wider text-xs rounded-xl bg-white hover:bg-slate-50 text-blue-600 border border-slate-350 hover:border-blue-400 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Baixar Resumo TXT
              </button>

              <button
                onClick={handleGenerateOccurrencesPDF}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 font-bold uppercase tracking-wider text-xs rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                Gerar Resumo PDF
              </button>

              <button
                onClick={() => setShowOccClearConfirm(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 font-bold uppercase tracking-wider text-xs rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 hover:border-rose-300 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Limpar Ocorrências
              </button>
            </section>
          </>
        )}
      </main>

      {/* Confirmation Modal to Clear Mapa Data */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 max-w-md w-full rounded-2xl shadow-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-rose-500" />
            <div className="flex items-start gap-4 text-slate-800">
              <div className="p-3 rounded-full bg-rose-500/10 text-rose-500">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold uppercase tracking-wide">Limpar Relatório?</h3>
                <p className="text-sm text-slate-505 mt-2 leading-relaxed">
                  Você está prestes a limpar todos os dados preenchidos e redefinir o logotipo. Esta operação não poderá ser desfeita. Tem certeza?
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-505 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer"
              >
                Não
              </button>
              <button
                onClick={handleClearAll}
                className="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 border border-rose-600 transition-all cursor-pointer"
              >
                Sim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal to Clear Occurrences */}
      {showOccClearConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 max-w-md w-full rounded-2xl shadow-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-rose-500" />
            <div className="flex items-start gap-4 text-slate-800">
              <div className="p-3 rounded-full bg-rose-500/10 text-rose-500">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold uppercase tracking-wide">Limpar Ocorrências?</h3>
                <p className="text-sm text-slate-505 mt-2 leading-relaxed">
                  Você está prestes a apagar todas as ocorrências cadastradas de todas as unidades. Esta operação não poderá ser desfeita. Tem certeza?
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowOccClearConfirm(false)}
                className="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-505 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer"
              >
                Não
              </button>
              <button
                onClick={handleClearOccurrences}
                className="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 border border-rose-600 transition-all cursor-pointer"
              >
                Sim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer institutional */}
      <footer className="text-center text-slate-500 text-xs mt-12 px-6">
        <p className="font-semibold">Batalhão Leste © 2026 - Polícia Militar do Amazonas</p>
        <p className="mt-1">PWA offline habilitado. Seus dados são salvos localmente e permanecem protegidos.</p>
      </footer>
    </div>
  );
}

export default App;
