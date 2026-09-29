'use client';

import React, { useState, useEffect, useRef } from 'react';

const getTodayKST = () => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
};

type TimelineItem = { id: number; time: string; content: string; nextDay: boolean };
type HdStaffItem = { id: number; typeLabel: string; name: string; start: string; end: string; endNextDay: boolean };
type AddManItem = { id: number; role: string; detailLabel: string; name: string; start: string; end: string; endNextDay: boolean };

const getFdrDefaultTimeline = (al: string) => ['1차 GATE S/U', `선행편(${al}000) PARKING`, 'CREW IN', 'BOARDING START', 'BOARDING CLOSE', 'DOOR CLOSE', 'PUSH BACK'];
const fhrTimelinesMap: Record<string, string[]> = {
  'FERRY OUT': ['GATE S/U', 'CREW S/U', 'CREW IN', '급유시작', 'EDI 출항승인', '급유종료', 'L/S 승인', 'DOOR CLOSE', 'PUSH BACK'],
  'FERRY IN': ['GATE S/U', 'PARKING', 'DOOR OPEN', 'CREW 하기 완료'],
  '자발적 하기': ['BRDG START', 'BRDG CLOSE', '자발적하기 승객 발생 INFO 접수 (승객 BAG HLD 요청)', '관계기관 INFO 완료', 'TCC 직원 인터뷰 후 해당 승객 하기 CFM AUTH 득', 'SYS 정리 및 OFLD BAG 1PC 하기 완료', 'APIS CLR 및 L/S 2번 승인 완료', 'TCC 직원 GATE(L2 DOOR) S/U', 'TCC 인터뷰 후 승객 항공기 하기 완료, 자체 보안점검', '자체 보안점검 완료', 'DOOR CLOSE', 'PUSH BACK'],
  '비자발적 하기': ['BRDG START', 'BRDG CLOSE', '비자발적하기 승객 발생 INFO 접수 (승객 BAG HLD 요청)', '관계기관 INFO 완료', 'TCC 직원 인터뷰 후 해당 승객 하기 CFM AUTH 득', 'SYS 정리 및 OFLD BAG 1PC 하기 완료', 'APIS CLR 및 L/S 2번 승인 완료', 'TCC 직원 GATE(L2 DOOR) S/U', 'TCC 인터뷰 후 승객 항공기 하기 완료, 자체 보안점검', '자체 보안점검 완료', 'DOOR CLOSE', 'PUSH BACK'],
  'RAMP RETURN': ['DOOR CLOSE', 'PUSH BACK', '운항통제로부터 정비로 인한 RAMP RETURN 확정 INFO 받음', 'A/C PARKING', 'DOOR RE-OPEN 후 정비사 IN', '로그 재시작', '정비 완료 및 연료변경으로 인한 LS 2번 승인', '로그 완료 및 DOOR CLOSE', 'PUSH BACK'],
  'DIVERT': ['ICN SPOT S/U', 'LANDING', 'PARKING', '승객하기 시작', 'BUS 탑승 시작', '승객 및 CREW 하기 완료', '모든 승객 수하물 수취 완료', '김포공항행 BUS 모두 출발'],
  '결항': ['결항 확정 INFO 접수', '승객 안내 방송 실시', '탑승수속 취소 및 수하물 반환 시작', '모든 승객 수하물 수취 및 귀가 완료'],
  'BUS HNDL': ['지연 도착 예정으로 BUS HNDL 가능성 접수', 'AK 직원 배정', '입국장 앞 S/U', 'LANDING', 'A/C PARKING', '승객 하기 시작', '승객 하기 완료', '수하물 투입 시작', '승객 수하물 수취 완료', '모든 지상 교통편 출발'],
  '기타(직접 입력)': ['내용 입력']
};

const DOMESTIC_AIRPORTS = ['ICN', 'GMP', 'PUS', 'CJU', 'MWX', 'YNY', 'CJJ', 'TAE', 'WJU', 'KPO', 'USN', 'HIN', 'KUV', 'KWJ', 'RSU', 'CHF', 'SSN', 'SWU', 'OSN', 'MPK', 'KAG', 'YEC', 'HMY', 'CHN', 'JDG'];

const getTimelineObjects = (arr: string[]): TimelineItem[] => 
  arr.map((c, i) => ({ id: Date.now() + Math.random(), time: '', content: c, nextDay: false }));

const acTypeOptions: Record<string, { label: string; cfg: string }[]> = {
  LJ: [
    { label: 'B738', cfg: '189' }, { label: 'B739', cfg: '188' }, { label: 'B738M', cfg: '189' }, { label: 'B772', cfg: '393' },
    { label: 'A321-200 (174)', cfg: '174' }, { label: 'A321-200', cfg: '220' }, { label: 'A321-195', cfg: '195' }, { label: 'A321neo', cfg: '232' }
  ],
  RS: [ { label: 'A321-200', cfg: '220' }, { label: 'A321-195', cfg: '195' } ],
  BX: [
    { label: 'A320-200', cfg: '180' }, { label: 'A321-200', cfg: '220' }, { label: 'A321-195', cfg: '195' },
    { label: 'A321neo', cfg: '232' }, { label: 'A321neo (220)', cfg: '220' }
  ]
};

const FLEET_DB: Record<string, { airline: string; type: string; cfg: string }> = {
  '8004': { airline: 'LJ', type: 'A321-200 (174)', cfg: '174' }, '8009': { airline: 'LJ', type: 'A321-200 (174)', cfg: '174' }, 
  '8775': { airline: 'LJ', type: 'A321neo', cfg: '232' }, '8776': { airline: 'LJ', type: 'A321neo', cfg: '232' }, '8778': { airline: 'LJ', type: 'A321neo', cfg: '232' }, 
  '7560': { airline: 'LJ', type: 'B738', cfg: '189' }, '7561': { airline: 'LJ', type: 'B738', cfg: '189' }, '7562': { airline: 'LJ', type: 'B738', cfg: '189' },
  '7757': { airline: 'LJ', type: 'B738', cfg: '189' }, '7786': { airline: 'LJ', type: 'B738', cfg: '189' }, '8012': { airline: 'LJ', type: 'B738', cfg: '189' },
  '8013': { airline: 'LJ', type: 'B738', cfg: '189' }, '8014': { airline: 'LJ', type: 'B738', cfg: '189' }, '8015': { airline: 'LJ', type: 'B738', cfg: '189' },
  '8016': { airline: 'LJ', type: 'B738', cfg: '189' }, '8017': { airline: 'LJ', type: 'B738', cfg: '189' }, '8224': { airline: 'LJ', type: 'B738', cfg: '189' },
  '8225': { airline: 'LJ', type: 'B738', cfg: '189' }, '8242': { airline: 'LJ', type: 'B738', cfg: '189' }, '8243': { airline: 'LJ', type: 'B738', cfg: '189' },
  '8244': { airline: 'LJ', type: 'B738', cfg: '189' }, '8245': { airline: 'LJ', type: 'B738', cfg: '189' }, '8246': { airline: 'LJ', type: 'B738', cfg: '189' },
  '8247': { airline: 'LJ', type: 'B738', cfg: '189' }, '7718': { airline: 'LJ', type: 'B739', cfg: '188' }, '7719': { airline: 'LJ', type: 'B739', cfg: '188' },
  '7724': { airline: 'LJ', type: 'B739', cfg: '188' }, '7215': { airline: 'LJ', type: 'B738M', cfg: '189' }, '7216': { airline: 'LJ', type: 'B738M', cfg: '189' },
  '7217': { airline: 'LJ', type: 'B738M', cfg: '189' }, '7218': { airline: 'LJ', type: 'B738M', cfg: '189' }, '8353': { airline: 'LJ', type: 'B738M', cfg: '189' },
  '8568': { airline: 'LJ', type: 'B738M', cfg: '189' }, '8569': { airline: 'LJ', type: 'B738M', cfg: '189' }, '7734': { airline: 'LJ', type: 'B772', cfg: '393' },
  '7743': { airline: 'LJ', type: 'B772', cfg: '393' }, '7750': { airline: 'LJ', type: 'B772', cfg: '393' },
  '7744': { airline: 'BX', type: 'A320-200', cfg: '180' }, '7753': { airline: 'BX', type: 'A320-200', cfg: '180' }, '8055': { airline: 'BX', type: 'A320-200', cfg: '180' },
  '8309': { airline: 'BX', type: 'A320-200', cfg: '180' }, '8328': { airline: 'BX', type: 'A320-200', cfg: '180' }, '7210': { airline: 'BX', type: 'A321-200', cfg: '220' },
  '7211': { airline: 'BX', type: 'A321-200', cfg: '220' }, '7729': { airline: 'BX', type: 'A321-195', cfg: '195' }, '7730': { airline: 'BX', type: 'A321-195', cfg: '195' },
  '8099': { airline: 'BX', type: 'A321-200', cfg: '220' }, '8256': { airline: 'BX', type: 'A321-195', cfg: '195' }, '8257': { airline: 'BX', type: 'A321-195', cfg: '195' },
  '8365': { airline: 'BX', type: 'A321-200', cfg: '220' }, '8357': { airline: 'BX', type: 'A321neo', cfg: '232' }, '8366': { airline: 'BX', type: 'A321neo (220)', cfg: '220' },
  '8394': { airline: 'BX', type: 'A321neo (220)', cfg: '220' }, '8395': { airline: 'BX', type: 'A321neo', cfg: '232' }, '8396': { airline: 'BX', type: 'A321neo', cfg: '232' },
  '8504': { airline: 'BX', type: 'A321neo', cfg: '232' }, '8525': { airline: 'BX', type: 'A321neo', cfg: '232' }, '8526': { airline: 'BX', type: 'A321neo', cfg: '232' },
  '7212': { airline: 'RS', type: 'A321-200', cfg: '220' }, '7789': { airline: 'RS', type: 'A321-195', cfg: '195' }, '7790': { airline: 'RS', type: 'A321-195', cfg: '195' },
  '8072': { airline: 'RS', type: 'A321-200', cfg: '220' }, '8073': { airline: 'RS', type: 'A321-200', cfg: '220' }, '8255': { airline: 'RS', type: 'A321-195', cfg: '195' },
};

const FIELD_TOOLTIPS: Record<string, { title: string; desc: string }> = {
  CFG: { title: 'CONFIG (가용 좌석 수)', desc: '해당 기종의 총 좌석 수입니다.' },
  BKG: { title: 'BOOKING (예약 승객 수)', desc: '최종 예약 인원수입니다.' },
  OBD: { title: 'ON BOARD (탑승 승객 수)', desc: '실제 탑승한 총 승객 수입니다. (INF 제외)' },
  INF: { title: 'INFANT (유아 수)', desc: '만 2세 미만 유아 승객 수입니다.' },
  STD: { title: 'STD / STA (표준 스케줄 시간)', desc: '원래 출발/도착 예정 시각입니다. (4자리 HHMM)' },
  ETD: { title: 'ETD / ETA (변경 예상 시간)', desc: '지연 등으로 변경 예상되는 출발/도착 시각입니다.' },
  ATD: { title: 'ATD / ATA (실제 운항 시간)', desc: '실제 이륙/착륙 시간입니다.' },
  REG: { title: 'REG No. (등록 기호)', desc: '항공기 꼬리번호 숫자 4자리입니다.' },
  SPOT: { title: 'SPOT (주기장 번호)', desc: '인천공항 주기장/게이트 번호입니다.' },
  HD_TIME: { title: '직원 H/D TIME (업무 시간)', desc: '현장에서 업무를 시작하고 종료한 시간입니다.' },
  ADD_MAN: { title: 'ADD MAN TIME (추가 인력 지원)', desc: '지원 인력 및 오피스(EDI) 직원의 투입 시간입니다.' },
  DLA_NOTICE: { title: 'DLA SET NOTICE (지연 통보)', desc: '지연 확정 안내를 통보받은 시각입니다.' },
};

export default function FlightReportGenerator() {
  const [step, setStep] = useState<'intro' | 'main' | 'logs' | 'myRecords'>('intro');
  const [reportMode, setReportMode] = useState<'FDR' | 'FHR'>('FDR');
  const [airline, setAirline] = useState<'LJ' | 'RS' | 'BX'>('LJ');

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPwInput, setAdminPwInput] = useState('');
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<{ title: string; desc: string } | null>(null);

  const [savedNames, setSavedNames] = useState<string[]>([]);
  const [timeAlertMsg, setTimeAlertMsg] = useState('');
  const [recordSearchQuery, setRecordSearchQuery] = useState('');
  
  const touchTimer = useRef<NodeJS.Timeout | null>(null);
  const isDraggingRef = useRef(false);
  const timeAlertTimeout = useRef<NodeJS.Timeout | null>(null);

  const [activeSection, setActiveSection] = useState<number>(1);
  const [maxUnlockedSection, setMaxUnlockedSection] = useState<number>(1);
  const [sectionErrors, setSectionErrors] = useState<Record<number, string[]>>({});
  const [manualOverrideAllowed, setManualOverrideAllowed] = useState(false);
  
  const [isAddManAutoAdjusted, setIsAddManAutoAdjusted] = useState(false);
  const [isEdiAutoAdjusted, setIsEdiAutoAdjusted] = useState(false);

  const toggleSection = (sec: number) => {
    if (sec <= maxUnlockedSection) {
      setActiveSection(prev => prev === sec ? 0 : sec);
    }
  };

  const triggerTimeAlert = (msg: string) => {
    setTimeAlertMsg(msg);
    if (timeAlertTimeout.current) clearTimeout(timeAlertTimeout.current);
    timeAlertTimeout.current = setTimeout(() => { setTimeAlertMsg(''); }, 4000);
  };

  // 🌟 관리자 로그인 핸들러 (버튼 클릭/엔터키 입력 시 최후 보루)
  const handleAdminLogin = () => {
    if (adminPwInput === '0000') {
      setShowAdminModal(false);
      setAdminPwInput('');
      setStep('logs');
    } else {
      alert('비밀번호가 올바르지 않습니다.');
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const names = localStorage.getItem('airkorea_recent_names');
      if (names) setSavedNames(JSON.parse(names));
      const savedWriterName = localStorage.getItem('airkorea_writer_name');
      const savedWriterPhone = localStorage.getItem('airkorea_writer_phone');
      if (savedWriterName) setWriterName(savedWriterName);
      if (savedWriterPhone) setWriterPhone(savedWriterPhone);
    }
  }, []);

  const handleSaveName = (nameToSave: string) => {
    if (!nameToSave.trim()) return;
    let existing = JSON.parse(localStorage.getItem('airkorea_recent_names') || '[]');
    existing = [nameToSave.trim(), ...existing.filter((n: string) => n !== nameToSave.trim())].slice(0, 5);
    localStorage.setItem('airkorea_recent_names', JSON.stringify(existing));
    setSavedNames(existing);
  };

  const removeSavedName = (nameToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedNames.filter(n => n !== nameToRemove);
    localStorage.setItem('airkorea_recent_names', JSON.stringify(updated));
    setSavedNames(updated);
  };

  const [flightNum, setFlightNum] = useState('');
  const [date, setDate] = useState(getTodayKST);
  const [originType, setOriginType] = useState('ICN');
  const [originCustom, setOriginCustom] = useState('');
  const [destType, setDestType] = useState('CUSTOM');
  const [destCustom, setDestCustom] = useState('');
  const [acTypeSelect, setAcTypeSelect] = useState('');
  const [acTypeCustom, setAcTypeCustom] = useState('');
  const [regNo, setRegNo] = useState('');
  const [spot, setSpot] = useState('');
  const [std, setStd] = useState('');
  const [etd, setEtd] = useState('');
  const [etdNextDay, setEtdNextDay] = useState(false);
  const [atd, setAtd] = useState('');
  const [atdNextDay, setAtdNextDay] = useState(false);
  const [cfg, setCfg] = useState('');
  const [bkg, setBkg] = useState('');
  const [obd, setObd] = useState('');
  const [inf, setInf] = useState('');

  const getAirlineLabel = (code: string) => {
    if (code === 'LJ') return '진에어';
    if (code === 'RS') return '에어서울';
    if (code === 'BX') return '에어부산';
    return '';
  };

  useEffect(() => {
    setManualOverrideAllowed(false); 
    if (regNo.length === 4) {
      const fleetInfo = FLEET_DB[regNo];
      if (fleetInfo) {
        if (fleetInfo.airline !== airline) {
          const isCrossOp = window.confirm(`⚠️ [소속 불일치 경고]\n\n입력하신 HL${regNo} 기재는 ${getAirlineLabel(fleetInfo.airline)}(${fleetInfo.airline}) 소속 항공기입니다.\n\n현재 선택된 편명은 ${airline}입니다. 타사 기재가 교차 투입된 것이 맞습니까?\n\n(단순 오타인 경우 [취소]를 눌러 다시 입력해주세요.)`);
          if (!isCrossOp) { setRegNo(''); setAcTypeSelect(''); setAcTypeCustom(''); setCfg(''); return; }
        }
        const existsInDropdown = acTypeOptions[airline].some(opt => opt.label === fleetInfo.type);
        if (existsInDropdown) setAcTypeSelect(fleetInfo.type);
        else { setAcTypeSelect('CUSTOM'); setAcTypeCustom(fleetInfo.type); }
        setCfg(fleetInfo.cfg); 
        triggerTimeAlert(`✅ HL${regNo} 기재 정보 자동 세팅 완료`);
      } else {
        setAcTypeSelect(''); setAcTypeCustom(''); setCfg('');
      }
    } else if (regNo.length < 4) {
      setAcTypeSelect(''); setAcTypeCustom(''); setCfg('');
    }
  }, [regNo, airline]);

  const handleOverrideCheck = (val: string, setter: (val: string) => void) => {
    if (regNo.length === 4 && FLEET_DB[regNo] && !manualOverrideAllowed) {
      if (window.confirm('자동 설정된 기종/CFG 값을 수동으로 변경하시겠습니까?\n(오류 입력 주의)')) {
        setManualOverrideAllowed(true);
        setter(val);
      }
    } else {
      setter(val);
    }
  };

  const handleAcTypeOverride = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (regNo.length === 4 && FLEET_DB[regNo] && !manualOverrideAllowed) {
      if (window.confirm('자동 설정된 기종/CFG 값을 수동으로 변경하시겠습니까?\n(오류 입력 주의)')) {
        setManualOverrideAllowed(true);
        setAcTypeSelect(val);
        if (val === 'CUSTOM' || val === '') setCfg('');
        else { const found = acTypeOptions[airline].find(item => item.label === val); if (found) setCfg(found.cfg); }
      }
    } else {
      setAcTypeSelect(val);
      if (val === 'CUSTOM' || val === '') setCfg('');
      else { const found = acTypeOptions[airline].find(item => item.label === val); if (found) setCfg(found.cfg); }
    }
  };

  const handleCfgOverride = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (regNo.length === 4 && FLEET_DB[regNo] && !manualOverrideAllowed) {
      if (window.confirm('자동 설정된 기종/CFG 값을 수동으로 변경하시겠습니까?\n(오류 입력 주의)')) {
        setManualOverrideAllowed(true);
        setCfg(val);
      }
    } else {
      setCfg(val);
    }
  };

  const [dlaPreset, setDlaPreset] = useState('항공기 연결 관계로 인한 출발 지연');
  const [dlaSummary, setDlaSummary] = useState('항공기 연결 관계로 인한 출발 지연');
  const [dlaNoticeSource, setDlaNoticeSource] = useState('NIL'); 
  const [dlaNoticeTime, setDlaNoticeTime] = useState('');
  const [dlaReason, setDlaReason] = useState('항공기 연결 관계로 인한 출발 지연');

  const [fhrType, setFhrType] = useState('FERRY OUT');
  const [fhrSubjectSummary, setFhrSubjectSummary] = useState('FERRY OUT - 국제선');
  const [fhrPaxNm, setFhrPaxNm] = useState('');
  const [fhrPaxCount, setFhrPaxCount] = useState('1');
  const [ferryType, setFerryType] = useState('국제선');
  const [fhrRzn, setFhrRzn] = useState('');
  const [fhrActn, setFhrActn] = useState('위 사유로 승객 인터뷰 진행 및 상태 확인하였으며, 구급대 지원 요청없이 하기 진행\n하기 완료 후 OFLD 업무 절차에 따라 역사열 진행');

  const [timeline, setTimeline] = useState<TimelineItem[]>(() => getTimelineObjects(getFdrDefaultTimeline('LJ')));
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const [othrSpcl, setOthrSpcl] = useState('');
  
  const [hdTimes, setHdTimes] = useState<HdStaffItem[]>([
    { id: 1, typeLabel: '1차 직원', name: '', start: '', end: '', endNextDay: false },
    { id: 2, typeLabel: '메인', name: '', start: '', end: '', endNextDay: false },
    { id: 3, typeLabel: 'AGT1', name: '', start: '', end: '', endNextDay: false },
    { id: 4, typeLabel: 'AGT2', name: '', start: '', end: '', endNextDay: false },
  ]);

  const [addManList, setAddManList] = useState<AddManItem[]>([
    { id: 1, role: 'AGNT', detailLabel: '1차 직원', name: '', start: '', end: '', endNextDay: false },
    { id: 2, role: 'SPVR', detailLabel: '메인', name: '', start: '', end: '', endNextDay: false },
    { id: 3, role: 'AGNT', detailLabel: 'AGT1', name: '', start: '', end: '', endNextDay: false },
    { id: 4, role: 'AGNT', detailLabel: 'AGT2', name: '', start: '', end: '', endNextDay: false },
    { id: 5, role: 'EDI', detailLabel: 'EDI', name: '', start: '', end: '', endNextDay: false }
  ]);

  const [introWriterName, setIntroWriterName] = useState('');
  const [writerName, setWriterName] = useState('');
  const [writerPhone, setWriterPhone] = useState('');

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewText, setPreviewText] = useState('');
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const [sheetLogs, setSheetLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [localRecords, setLocalRecords] = useState<any[]>([]);

  const formatAviationDate = (dateString: string) => {
    if (!dateString) return ''; const parts = dateString.split('-'); if (parts.length !== 3) return '';
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const mIdx = parseInt(parts[1], 10) - 1;
    return `${parts[2]}${months[mIdx]}${parts[0].slice(-2)}`;
  };

  const getOriginCode = () => originType === 'CUSTOM' ? (originCustom.trim().toUpperCase() || 'XXX') : originType;
  const getDestCode = () => destType === 'CUSTOM' ? (destCustom.trim().toUpperCase() || 'XXX') : destType;
  const getFinalRoute = () => `${getOriginCode()}-${getDestCode()}`;
  const getFinalAcType = () => acTypeSelect === 'CUSTOM' ? acTypeCustom.trim().toUpperCase() : acTypeSelect;
  const isInbound = getDestCode() === 'ICN';
  const lblS = isInbound ? 'STA' : 'STD';
  const lblE = isInbound ? 'ETA' : 'ETD';
  const lblA = isInbound ? 'ATA' : 'ATD';
  const isFerry = reportMode === 'FHR' && (fhrType === 'FERRY OUT' || fhrType === 'FERRY IN');

  const hudDate = formatAviationDate(date) || 'DDMMMYY';
  const hudFlight = flightNum ? `${airline}${flightNum.padStart(3, '0')}` : `${airline}---`;
  const hudRoute = `${getOriginCode()}-${getDestCode()}`;
  const hudReg = regNo.length === 4 ? `HL${regNo}` : 'HL----';
  const hudAc = getFinalAcType() || '---';
  const hudCfg = cfg || '---';
  const hudSpot = spot || '---';
  const hudStd = std ? `${std}L` : '----L';
  const hudEtd = etd ? `${etd}L${etdNextDay ? '(+1)' : ''}` : '----L';
  const hudAtd = atd ? `${atd}L${atdNextDay ? '(+1)' : ''}` : '----L';

  // 국내선 자동 감지 로직
  useEffect(() => {
    if (reportMode === 'FHR') {
      const origin = getOriginCode();
      const dest = getDestCode();
      if (origin !== 'XXX' && dest !== 'XXX' && DOMESTIC_AIRPORTS.includes(origin) && DOMESTIC_AIRPORTS.includes(dest)) {
        if (ferryType !== '국내선') {
          if (window.confirm("출발지와 도착지가 모두 국내 공항입니다.\n운항 성격을 [국내선]으로 자동 전환하시겠습니까?")) {
            setFerryType('국내선');
          }
        }
      }
    }
  }, [originType, originCustom, destType, destCustom, reportMode, fhrType]);

  const resetStaffList = (mode: string, type: string) => {
    const shortTypes = ['FERRY OUT', 'FERRY IN', '자발적 하기', '비자발적 하기', 'DIVERT', 'BUS HNDL'];
    if (mode === 'FHR' && shortTypes.includes(type)) {
      setHdTimes([{ id: 1, typeLabel: 'AGT1', name: '', start: '', end: '', endNextDay: false }, { id: 2, typeLabel: 'AGT2', name: '', start: '', end: '', endNextDay: false }]);
      setAddManList([{ id: 1, role: 'AGNT', detailLabel: 'AGT1', name: '', start: '', end: '', endNextDay: false }, { id: 2, role: 'AGNT', detailLabel: 'AGT2', name: '', start: '', end: '', endNextDay: false }, { id: 3, role: 'EDI', detailLabel: 'EDI', name: '', start: '', end: '', endNextDay: false }]);
    } else {
      setHdTimes([{ id: 1, typeLabel: '1차 직원', name: '', start: '', end: '', endNextDay: false }, { id: 2, typeLabel: '메인', name: '', start: '', end: '', endNextDay: false }, { id: 3, typeLabel: 'AGT1', name: '', start: '', end: '', endNextDay: false }, { id: 4, typeLabel: 'AGT2', name: '', start: '', end: '', endNextDay: false }]);
      setAddManList([{ id: 1, role: 'AGNT', detailLabel: '1차 직원', name: '', start: '', end: '', endNextDay: false }, { id: 2, role: 'SPVR', detailLabel: '메인', name: '', start: '', end: '', endNextDay: false }, { id: 3, role: 'AGNT', detailLabel: 'AGT1', name: '', start: '', end: '', endNextDay: false }, { id: 4, role: 'AGNT', detailLabel: 'AGT2', name: '', start: '', end: '', endNextDay: false }, { id: 5, role: 'EDI', detailLabel: 'EDI', name: '', start: '', end: '', endNextDay: false }]);
    }
  };

  const clearFormFields = () => {
    setFlightNum(''); setDate(getTodayKST()); setOriginType('ICN'); setOriginCustom(''); setDestType('CUSTOM'); setDestCustom('');
    setAcTypeSelect(''); setAcTypeCustom(''); setRegNo(''); setSpot(''); setStd(''); setEtd(''); setEtdNextDay(false); setAtd(''); setAtdNextDay(false);
    setCfg(''); setBkg(''); setObd(''); setInf('');
    setDlaPreset('항공기 연결 관계로 인한 출발 지연'); setDlaSummary('항공기 연결 관계로 인한 출발 지연'); setDlaNoticeSource('NIL'); setDlaNoticeTime(''); setDlaReason('항공기 연결 관계로 인한 출발 지연');
    setFhrType('FERRY OUT'); setFhrSubjectSummary('FERRY OUT - 국제선'); setFhrPaxNm(''); setFhrPaxCount('1'); setFerryType('국제선'); setFhrRzn(''); setFhrActn('위 사유로 승객 인터뷰 진행 및 상태 확인하였으며, 구급대 지원 요청없이 하기 진행\n하기 완료 후 OFLD 업무 절차에 따라 역사열 진행');
    setTimeline(getTimelineObjects(getFdrDefaultTimeline(airline))); setOthrSpcl('');
    resetStaffList(reportMode, 'FERRY OUT');
    setMaxUnlockedSection(1);
    setActiveSection(1);
    setSectionErrors({});
    setIsAddManAutoAdjusted(false);
    setIsEdiAutoAdjusted(false);
  };

  const isDefaultRzn = (rzn: string) => { return ['건강 상 사유에 따른 승객 요청으로 1 PAX OFLD', '회사 규정에 따른 비자발적 하기 조치 진행', 'NIL', '정비로 인한 RAMP RETURN', 'GMP CURFEW로 인한 ICN DIVRT', '기상악화로 인한 결항', '연결편 항공기 지연 도착으로 인한 BUS HNDL', ''].includes(rzn.trim()) || rzn.includes('기재 중정비를 위한 FERRY 운항'); };
  const isDefaultActn = (actn: string) => { return ['위 사유로 승객 인터뷰 진행 및 상태 확인하였으며, 구급대 지원 요청없이 하기 진행\n하기 완료 후 OFLD 업무 절차에 따라 역사열 진행', '입국장 교통편 안내', '', 'NIL'].includes(actn.trim()); };
  const isDefaultSpcl = (spcl: string) => { return ['', 'NIL', 'HOT CLM 승객 발생', 'COMPLAIN : NIL'].includes(spcl.trim()); };

  useEffect(() => {
    if (reportMode === 'FHR' && (fhrType === 'FERRY OUT' || fhrType === 'FERRY IN')) {
      setFhrSubjectSummary(`${fhrType} - ${ferryType}`);
      if (ferryType === '국제선(중정비)') {
        const rNo = (regNo && regNo.length > 0) ? regNo : '0000';
        if (isDefaultRzn(fhrRzn) || fhrRzn === '') setFhrRzn(`HL${rNo} 기재 중정비를 위한 FERRY 운항`);
      } else { if (isDefaultRzn(fhrRzn) || fhrRzn.includes('기재 중정비를 위한 FERRY 운항')) setFhrRzn(''); }
    }
  }, [reportMode, fhrType, ferryType, regNo]);

  useEffect(() => {
    if (step === 'myRecords') { const saved = localStorage.getItem('airkorea_report_history'); if (saved) setLocalRecords(JSON.parse(saved)); }
  }, [step]);

  const fetchLogsFromSheet = async () => {
    setIsLoadingLogs(true);
    try { const res = await fetch('/api/log'); const json = await res.json(); if (json.success && json.data && json.data.length > 1) { setSheetLogs(json.data.slice(1).reverse()); } else { setSheetLogs([]); } } 
    catch (err) { console.error('로그 불러오기 실패:', err); } finally { setIsLoadingLogs(false); }
  };

  const toMinutes = (hhmm: string) => { if (!hhmm || hhmm.length !== 4) return 0; return parseInt(hhmm.slice(0, 2), 10) * 60 + parseInt(hhmm.slice(2, 4), 10); };
  const toHHMM = (min: number) => { return `${String(Math.floor(min / 60) % 24).padStart(2, '0')}${String(min % 60).padStart(2, '0')}`; };
  const calculateDuration = (start: string, end: string, isNextDay: boolean) => {
    if (start.length !== 4 || end.length !== 4) return null;
    let sMin = toMinutes(start); let eMin = toMinutes(end) + (isNextDay ? 1440 : 0);
    if (eMin < sMin - 300 && !isNextDay) eMin += 1440;
    const diff = Math.max(0, eMin - sMin); const h = Math.floor(diff / 60); const m = diff % 60;
    return `${String(h).padStart(2, '0')}HR ${String(m).padStart(2, '0')}MINS`;
  };
  const getDlaTimeStr = () => calculateDuration(std, atd, atdNextDay);

  const getFormattedObd = () => {
    if (isFerry) return '0'; if (!obd) return '';
    if (inf && inf.trim() !== '' && inf.trim() !== '0') {
      const obdNum = parseInt(obd, 10) || 0; const infNum = parseInt(inf, 10) || 0;
      return `TTL ${obdNum + infNum} (OBD ${obdNum}, INF ${infNum})`;
    }
    return obd;
  };

  const saveToLocalStorage = (isDraft = false) => {
    if (writerName.trim()) localStorage.setItem('airkorea_writer_name', writerName.trim());
    if (writerPhone.trim()) localStorage.setItem('airkorea_writer_phone', writerPhone.trim());
    const currentState = {
      airline, reportMode, flightNum, date, originType, originCustom, destType, destCustom, acTypeSelect, acTypeCustom, regNo, spot, std, etd, etdNextDay, atd, atdNextDay, cfg, bkg, obd, inf, dlaPreset, dlaSummary, dlaNoticeSource, dlaNoticeTime, dlaReason, fhrType, fhrSubjectSummary, fhrPaxNm, fhrPaxCount, ferryType, fhrRzn, fhrActn, timeline, othrSpcl, hdTimes, addManList, introWriterName, writerName, writerPhone
    };
    const titlePrefix = isDraft ? '⚠️ [임시저장]' : `[${reportMode}]`;
    const fNumDisplay = flightNum ? flightNum : '미상';
    const record = { id: Date.now(), timestamp: new Date().toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }), summaryTitle: `${titlePrefix} ${airline}${fNumDisplay} (${date})`, detail: reportMode === 'FDR' ? dlaSummary : fhrType, state: currentState };
    const existing = JSON.parse(localStorage.getItem('airkorea_report_history') || '[]');
    const updated = [record, ...existing].slice(0, 30);
    localStorage.setItem('airkorea_report_history', JSON.stringify(updated));
    if (isDraft) alert('✅ 작성 중인 내용이 내 기기에 안전하게 임시저장되었습니다.\n(첫 화면의 [저장된 기록 불러오기]에서 확인 가능합니다.)');
  };

  const handleLoadRecord = (stateToLoad: any) => {
    setAirline(stateToLoad.airline || 'LJ'); setReportMode(stateToLoad.reportMode || 'FDR'); setFlightNum(stateToLoad.flightNum || ''); setDate(stateToLoad.date || getTodayKST()); setOriginType(stateToLoad.originType || 'ICN'); setOriginCustom(stateToLoad.originCustom || ''); setDestType(stateToLoad.destType || 'CUSTOM'); setDestCustom(stateToLoad.destCustom || ''); setAcTypeSelect(stateToLoad.acTypeSelect || ''); setAcTypeCustom(stateToLoad.acTypeCustom || ''); setRegNo(stateToLoad.regNo || ''); setSpot(stateToLoad.spot || ''); setStd(stateToLoad.std || ''); setEtd(stateToLoad.etd || ''); setEtdNextDay(stateToLoad.etdNextDay || false); setAtd(stateToLoad.atd || ''); setAtdNextDay(stateToLoad.atdNextDay || false); setCfg(stateToLoad.cfg || ''); setBkg(stateToLoad.bkg || ''); setObd(stateToLoad.obd || ''); setInf(stateToLoad.inf || ''); setDlaPreset(stateToLoad.dlaPreset || '직접 입력'); setDlaSummary(stateToLoad.dlaSummary || ''); setDlaNoticeSource(stateToLoad.dlaNoticeSource || 'NIL'); setDlaNoticeTime(stateToLoad.dlaNoticeTime || ''); setDlaReason(stateToLoad.dlaReason || ''); setFhrType(stateToLoad.fhrType || 'FERRY OUT'); setFhrSubjectSummary(stateToLoad.fhrSubjectSummary || ''); setFhrPaxNm(stateToLoad.fhrPaxNm || ''); setFhrPaxCount(stateToLoad.fhrPaxCount || '1'); setFerryType(stateToLoad.ferryType || '국제선'); setFhrRzn(stateToLoad.fhrRzn || ''); setFhrActn(stateToLoad.fhrActn || ''); setTimeline(stateToLoad.timeline || []); setOthrSpcl(stateToLoad.othrSpcl || ''); setHdTimes(stateToLoad.hdTimes || []); setAddManList(stateToLoad.addManList || []); setIntroWriterName(stateToLoad.introWriterName || ''); setWriterName(stateToLoad.writerName || ''); setWriterPhone(stateToLoad.writerPhone || '');
    setStep('main'); setMaxUnlockedSection(10); setActiveSection(1); setSectionErrors({}); setIsAddManAutoAdjusted(false); setIsEdiAutoAdjusted(false);
  };

  const deleteLocalRecord = (id: number) => {
    if(confirm('이 기록을 기기에서 삭제하시겠습니까?')) { const existing = JSON.parse(localStorage.getItem('airkorea_report_history') || '[]'); const updated = existing.filter((r: any) => r.id !== id); localStorage.setItem('airkorea_report_history', JSON.stringify(updated)); setLocalRecords(updated); }
  };

  const sendIntroLogToGoogleSheet = async (writerName: string, mode: string, al: string) => {
    try { await fetch('/api/log', { method: 'POST', headers: { 'Content-Type': 'application/json', }, body: JSON.stringify({ userName: writerName.trim() || '미입력', mode: mode, flightNum: `[작성 진입]`, date: getTodayKST(), route: `---`, acType: `---`, regNo: `---`, spot: `---`, paxStatus: `--- / --- / ---`, dlaSummary: `🟢 [시스템 접속 및 작성 시작]`, phone: `---`, reportText: '작성 시작 단계의 접속 로그입니다.', }), }); } catch (error) { console.error('진입 로그 저장 에러:', error); }
  };

  const sendLogToGoogleSheet = async (finalReportText: string) => {
    try {
      let finalSummary = reportMode === 'FDR' ? dlaSummary : fhrType;
      if (missingFields && missingFields.length > 0) finalSummary = `🚨 [강제복사] ${finalSummary} (누락: ${missingFields.join(', ')})`;
      await fetch('/api/log', { method: 'POST', headers: { 'Content-Type': 'application/json', }, body: JSON.stringify({ userName: introWriterName.trim() || writerName.trim() || '미입력', mode: reportMode, flightNum: flightNum ? `${airline}${flightNum.toUpperCase()}` : '미입력', date: date || '미입력', route: `${getOriginCode()}-${getDestCode()}`, acType: getFinalAcType() || '미입력', regNo: regNo ? `HL${regNo}` : '미입력', spot: spot || '미입력', paxStatus: `${cfg || '-'} / ${isFerry ? '0' : bkg || '-'} / ${getFormattedObd() || '-'}`, dlaSummary: finalSummary, phone: writerPhone || '미입력', reportText: finalReportText, }), });
    } catch (error) { console.error('구글 시트 저장 에러:', error); }
  };

  const handleAirlineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newAl = e.target.value as 'LJ' | 'RS' | 'BX'; setAirline(newAl); setAcTypeSelect(''); setAcTypeCustom(''); setCfg(''); setDlaNoticeSource('NIL');
    if (reportMode === 'FDR') setTimeline(getTimelineObjects(getFdrDefaultTimeline(newAl)));
  };

  const handleReportModeChange = (mode: 'FDR' | 'FHR') => {
    setReportMode(mode);
    if (mode === 'FDR') { setTimeline(getTimelineObjects(getFdrDefaultTimeline(airline))); resetStaffList('FDR', ''); } 
    else { setFhrType('FERRY OUT'); setFerryType('국제선'); setFhrSubjectSummary('FERRY OUT - 국제선'); setFhrRzn(''); setTimeline(getTimelineObjects(fhrTimelinesMap['FERRY OUT'])); setOthrSpcl(''); resetStaffList('FHR', 'FERRY OUT'); }
  };

  const isEdiRequired = () => {
    if (reportMode === 'FDR') return true;
    if (reportMode === 'FHR') { if (fhrType === 'FERRY OUT' || fhrType === 'FERRY IN') return ferryType === '국제선' || ferryType === '국제선(중정비)'; return false; }
    return false;
  };

  const processTimeValue = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '').slice(0, 4);
    if (clean.length === 4) {
      let h = parseInt(clean.slice(0, 2), 10); let m = parseInt(clean.slice(2, 4), 10); if (m > 59) m = 59;
      let autoNextDay = false; let forceUncheck = false;
      if (h >= 24) { h = h % 24; autoNextDay = true; } else if (h >= 0 && h <= 5) autoNextDay = true; else forceUncheck = true; 
      return { time: `${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}`, autoNextDay, forceUncheck };
    }
    return { time: clean, autoNextDay: false, forceUncheck: false };
  };

  const handleFlightTimeInput = (val: string, setTime: (t: string) => void, setNextDay?: (b: boolean) => void) => {
    const { time, autoNextDay, forceUncheck } = processTimeValue(val); setTime(time);
    if (setNextDay) { if (autoNextDay) setNextDay(true); else if (forceUncheck) setNextDay(false); }
  };

  const handleTimelineChange = (id: number, field: 'time' | 'content' | 'nextDay', val: any) => {
    setTimeline(prev => prev.map(t => {
      if (t.id === id) {
        if (field === 'time') { const { time, autoNextDay, forceUncheck } = processTimeValue(val); let isNextDay = t.nextDay; if (autoNextDay) isNextDay = true; else if (forceUncheck) isNextDay = false; return { ...t, time, nextDay: isNextDay }; }
        return { ...t, [field]: val };
      }
      return t;
    }));
  };

  const insertTimelineItem = (index: number) => { const newTimeline = [...timeline]; newTimeline.splice(index + 1, 0, { id: Date.now() + Math.random(), time: '', content: '', nextDay: false }); setTimeline(newTimeline); };
  const handleAddTimeline = () => setTimeline([...timeline, { id: Date.now() + Math.random(), time: '', content: '', nextDay: false }]);
  const handleRemoveTimeline = (id: number) => setTimeline(timeline.filter(t => t.id !== id));

  const handleNameChange = (id: number, val: string) => {
    const cleanVal = val.trim().toUpperCase();
    if (['EDI', 'OFC', '오피스', 'OFFICE'].includes(cleanVal)) { triggerTimeAlert('🚨 해당 란에는 부서명이 아닌 [실제 투입된 직원 이름]을 적어 주세요!'); val = ''; }
    setHdTimes(prev => prev.map(item => item.id === id ? { ...item, name: val } : item)); 
    setAddManList(prev => prev.map(item => item.id === id ? { ...item, name: val } : item));
  };
  
  const handleRoleChange = (id: number, val: string) => { 
    setAddManList(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, role: val };
        if (val === 'EDI' && updated.start.length === 4 && updated.end.length === 4) {
          let sMin = toMinutes(updated.start);
          let eMin = toMinutes(updated.end) + (updated.endNextDay ? 1440 : 0);
          if (eMin < sMin && !updated.endNextDay) eMin += 1440;
          if (eMin - sMin > 60) {
            updated.start = toHHMM((eMin - 60) % 1440);
            setIsEdiAutoAdjusted(true);
          }
        }
        return updated;
      }
      return item;
    })); 
  };
  
  const handleCheckboxChange = (id: number, isChecked: boolean) => { 
    setHdTimes(prev => prev.map(item => item.id === id ? { ...item, endNextDay: isChecked } : item)); 
    setAddManList(prev => prev.map(item => item.id === id ? { ...item, endNextDay: isChecked } : item)); 
  };

  const handleHdTimeChange = (id: number, field: 'start' | 'end', val: string) => {
    const { time: processedVal, autoNextDay, forceUncheck } = processTimeValue(val);
    
    setHdTimes(prev => prev.map(item => { 
      if (item.id === id) { 
        const updated = { ...item, [field]: processedVal }; 
        if (field === 'end') { 
          if (autoNextDay) updated.endNextDay = true; 
          else if (forceUncheck) updated.endNextDay = false; 
        } 
        return updated; 
      } 
      return item; 
    }));

    setAddManList(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item };
        if (field === 'start') {
          let addManStart = processedVal;
          let adjusted = false;
          if (reportMode === 'FDR' && addManStart.length === 4 && std.length === 4) { 
            const stdMin = toMinutes(std); 
            const inputMin = toMinutes(addManStart); 
            if (inputMin < stdMin + 60) { 
              addManStart = toHHMM((stdMin + 60) % 1440); 
              adjusted = true;
            } 
          }
          if (reportMode === 'FDR' && addManStart.length === 4 && atd.length === 4) { 
            const atdMin = toMinutes(atd) + (atdNextDay ? 1440 : 0); 
            if (toMinutes(addManStart) > atdMin) addManStart = atd; 
          }
          updated.start = addManStart;
          if(adjusted) setIsAddManAutoAdjusted(true);
        }
        if (field === 'end') {
          let addManEnd = processedVal; let addManEndNextDay = updated.endNextDay;
          if (autoNextDay) addManEndNextDay = true; else if (forceUncheck) addManEndNextDay = false;
          if (reportMode === 'FDR' && addManEnd.length === 4 && atd.length === 4) { 
            const inputMin = toMinutes(addManEnd) + (addManEndNextDay ? 1440 : 0); 
            const atdMin = toMinutes(atd) + (atdNextDay ? 1440 : 0); 
            if (inputMin > atdMin) { 
              addManEnd = atd; addManEndNextDay = atdNextDay; 
            } 
          }
          updated.end = addManEnd; updated.endNextDay = addManEndNextDay;
        }
        return updated;
      }
      return item;
    }));
  };

  const handleAddManTimeChange = (id: number, field: 'start' | 'end', val: string) => {
    const { time: processedVal, autoNextDay, forceUncheck } = processTimeValue(val);
    setAddManList(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item };
        if (field === 'start') {
          let addManStart = processedVal;
          if (reportMode === 'FDR' && addManStart.length === 4 && std.length === 4) { const stdMin = toMinutes(std); const inputMin = toMinutes(addManStart); if (inputMin < stdMin + 60) { addManStart = toHHMM((stdMin + 60) % 1440); setIsAddManAutoAdjusted(true); } }
          if (reportMode === 'FDR' && addManStart.length === 4 && atd.length === 4) { const atdMin = toMinutes(atd) + (atdNextDay ? 1440 : 0); if (toMinutes(addManStart) > atdMin) addManStart = atd; }
          updated.start = addManStart;
        }
        if (field === 'end') {
          let addManEnd = processedVal; let addManEndNextDay = updated.endNextDay;
          if (autoNextDay) addManEndNextDay = true; else if (forceUncheck) addManEndNextDay = false;
          if (reportMode === 'FDR' && addManEnd.length === 4 && atd.length === 4) { const inputMin = toMinutes(addManEnd) + (addManEndNextDay ? 1440 : 0); const atdMin = toMinutes(atd) + (atdNextDay ? 1440 : 0); if (inputMin > atdMin) { addManEnd = atd; addManEndNextDay = atdNextDay; } }
          updated.end = addManEnd; updated.endNextDay = addManEndNextDay;
        }
        if (updated.role === 'EDI' && updated.start.length === 4 && updated.end.length === 4) { let sMin = toMinutes(updated.start); let eMin = toMinutes(updated.end) + (updated.endNextDay ? 1440 : 0); if (eMin < sMin && !updated.endNextDay) eMin += 1440; if (eMin - sMin > 60) { updated.start = toHHMM((eMin - 60) % 1440); setIsEdiAutoAdjusted(true); } }
        return updated;
      }
      return item;
    }));
  };

  const handleAddHdStaff = () => { const newId = Date.now() + Math.random(); setHdTimes(prev => [...prev, { id: newId, typeLabel: '추가인원', name: '', start: '', end: '', endNextDay: false }]); setAddManList(prev => [...prev, { id: newId, role: 'AGNT', detailLabel: '추가인원', name: '', start: '', end: '', endNextDay: false }]); };
  const handleRemoveHdStaff = (id: number) => { setHdTimes(prev => prev.filter(h => h.id !== id)); setAddManList(prev => prev.filter(a => a.id !== id)); };
  const handleAddManStaff = () => { const newId = Date.now() + Math.random(); setAddManList(prev => [...prev, { id: newId, role: 'AGNT', detailLabel: '추가인원', name: '', start: '', end: '', endNextDay: false }]); };
  const handleRemoveManStaff = (id: number) => { setAddManList(prev => prev.filter(a => a.id !== id)); };

  const handleFhrTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value; const shortTypes = ['FERRY OUT', 'FERRY IN', '자발적 하기', '비자발적 하기', 'DIVERT', 'BUS HNDL'];
    if (shortTypes.includes(fhrType) !== shortTypes.includes(type)) resetStaffList('FHR', type);
    setFhrType(type); setTimeline(getTimelineObjects(fhrTimelinesMap[type] || []));
    if (type === '자발적 하기') { setFhrSubjectSummary('건강 상의 사유로 인한 자발적 하기 발생'); if (isDefaultRzn(fhrRzn) || !fhrRzn) setFhrRzn('건강 상 사유에 따른 승객 요청으로 1 PAX OFLD'); if (isDefaultSpcl(othrSpcl)) setOthrSpcl(''); if (isDefaultActn(fhrActn)) setFhrActn('위 사유로 승객 인터뷰 진행 및 상태 확인하였으며, 구급대 지원 요청없이 하기 진행\n하기 완료 후 OFLD 업무 절차에 따라 역사열 진행'); }
    else if (type === '비자발적 하기') { setFhrSubjectSummary('승객 비자발적 하기 발생'); if (isDefaultRzn(fhrRzn) || !fhrRzn) setFhrRzn('회사 규정에 따른 비자발적 하기 조치 진행'); if (isDefaultSpcl(othrSpcl)) setOthrSpcl(''); if (isDefaultActn(fhrActn)) setFhrActn('위 사유로 승객 인터뷰 진행 및 상태 확인하였으며, 구급대 지원 요청없이 하기 진행\n하기 완료 후 OFLD 업무 절차에 따라 역사열 진행'); }
    else if (type === 'FERRY OUT') { setFerryType('국제선'); setFhrRzn(''); setOthrSpcl(''); }
    else if (type === 'FERRY IN') { setFerryType('국제선'); setDestType('ICN'); setOriginType('CUSTOM'); setOriginCustom(''); setFhrRzn(''); setOthrSpcl(''); }
    else if (type === 'RAMP RETURN') { setFhrSubjectSummary('항공기 정비로 인한 RAMP RTN'); if (isDefaultRzn(fhrRzn) || !fhrRzn) setFhrRzn('정비로 인한 RAMP RETURN'); if (isDefaultSpcl(othrSpcl)) setOthrSpcl(''); }
    else if (type === 'DIVERT') { setFhrSubjectSummary('GMP CURFEW로 인한 ICN DIVRT'); if (isDefaultRzn(fhrRzn) || !fhrRzn) setFhrRzn('GMP CURFEW로 인한 ICN DIVRT'); if (isDefaultSpcl(othrSpcl)) setOthrSpcl('HOT CLM 승객 발생'); }
    else if (type === '결항') { setFhrSubjectSummary('기상악화로 인한 결항'); if (isDefaultRzn(fhrRzn) || !fhrRzn) setFhrRzn('기상악화로 인한 결항'); if (isDefaultSpcl(othrSpcl)) setOthrSpcl(''); }
    else if (type === 'BUS HNDL') { setFhrSubjectSummary('I/B 지연 도착으로 인한 BUS HNDL'); if (isDefaultRzn(fhrRzn) || !fhrRzn) setFhrRzn('연결편 항공기 지연 도착으로 인한 BUS HNDL'); if (isDefaultSpcl(othrSpcl)) setOthrSpcl('COMPLAIN : NIL'); if (isDefaultActn(fhrActn)) setFhrActn('입국장 교통편 안내'); }
    else if (type === '기타(직접 입력)') { setFhrSubjectSummary(''); if (isDefaultRzn(fhrRzn)) setFhrRzn(''); if (isDefaultSpcl(othrSpcl)) setOthrSpcl(''); }
  };

  const generateMailContent = () => {
    const isFhr = reportMode === 'FHR'; const isOfld = isFhr && (fhrType === '자발적 하기' || fhrType === '비자발적 하기');
    const avDate = formatAviationDate(date); const formattedEtd = etd ? `${etd}L${etdNextDay ? '(+1)' : ''}` : '----L'; const formattedAtd = atd ? `${atd}L${atdNextDay ? '(+1)' : ''}` : '----L'; const formattedRegNo = regNo ? `HL${regNo}` : '---'; const formattedFlightNum = flightNum ? `${airline}${flightNum.toUpperCase()}` : `${airline}---`; const finalRoute = getFinalRoute();
    const subjectPrefix = isFhr ? `F.H.R ${formattedFlightNum} ON ${avDate} ${finalRoute}` : `F.D.R ${formattedFlightNum} ON ${avDate} ${finalRoute}`; 
    const subjectSuffix = isFhr ? fhrSubjectSummary : dlaSummary; 
    const subject = `${subjectPrefix} / ${subjectSuffix}`;

    const finalOthrSpcl = othrSpcl.trim() ? othrSpcl : 'NIL';
    const finalFhrRzn = fhrRzn.trim() ? fhrRzn : 'NIL';

    const othrSpclText = finalOthrSpcl.split('\n').map(l => `   ○ ${l}`).join('\n');
    const hdTimeLines = hdTimes.filter(h => h.name || h.start || h.end).map(h => `   ○ ${h.start || '----'}L - ${h.end || '----'}L${h.endNextDay ? '(+1)' : ''} : ${h.name}`).join('\n');
    const activeStaffs = addManList.filter(s => s.name && s.start && s.end);
    const counts: Record<string, number> = { SPVR: 0, AGNT: 0, EDI: 0 }; activeStaffs.forEach(s => { counts[s.role] = (counts[s.role] || 0) + 1; });
    const addManHeader = `   GATE SPVR ${counts['SPVR'] || 0} / AGNT ${counts['AGNT'] || 0} / EDI(오피스) ${counts['EDI'] || 0}`;
    const formattedAddManLines = activeStaffs.map(s => {
      let startMin = toMinutes(s.start); let endMin = toMinutes(s.end) + (s.endNextDay ? 1440 : 0); if (endMin < startMin - 300 && !s.endNextDay) endMin += 1440;
      const diffMin = Math.max(0, endMin - startMin); const diffH = Math.floor(diffMin / 60); const diffM = diffMin % 60; const durStr = `${String(diffH).padStart(2, '0')} HR ${String(diffM).padStart(2, '0')} MINS`;
      const timeSlotStr = `${formattedFlightNum} (${s.start}L${s.endNextDay && s.start < s.end ? '' : ''} - ${s.end}L${s.endNextDay ? '(+1)' : ''}) : ${s.role === 'EDI' ? 'EDI' : 'AGT'} ${s.name}`;
      return `   ○ ${timeSlotStr.padEnd(32, ' ')} // ${durStr}`;
    });
    const addManText = formattedAddManLines.length > 0 ? `${addManHeader}\n${formattedAddManLines.join('\n')}` : `   ${addManHeader}\n   ○ NIL`;
    const formattedTimelineLines = timeline.map(t => { const timeStr = (t.time && t.time.length === 4) ? `${t.time}L` : '----L'; const nextStr = t.nextDay ? '(+1)' : ''; return `   ○ ${timeStr}${nextStr} : ${t.content || '내용 미입력'}`; }).join('\n');

    let blocks = [];
    blocks.push({ title: "A/C TYPE N REG", content: `   ○ ${getFinalAcType() || '---'} / ${formattedRegNo}` });
    blocks.push({ title: `${lblS} / ${lblE} / ${lblA}`, content: `   ○ ${std ? std+'L' : '----L'} / ${formattedEtd} / ${formattedAtd}` });
    if (isFhr) {
      if (fhrType === 'BUS HNDL') { const dlaTimeStr = getDlaTimeStr() || '00HR 00MINS'; blocks.push({ title: "DLA TIME N RSN", content: `   ○ DLA TIME : ${dlaTimeStr}\n   ○ ${finalFhrRzn.split('\n').join('\n   ○ ')}` }); } 
      else { blocks.push({ title: "RZN", content: finalFhrRzn.split('\n').map(l => `   ○ ${l}`).join('\n') }); }
    } else {
      let dlaNoticeText = '   ○ DLA SET NOTICE : NIL'; if (dlaNoticeSource !== 'NIL') { dlaNoticeText = `   ○ DLA SET NOTICE : ${dlaNoticeTime ? dlaNoticeTime + 'L' : '----L'} (${dlaNoticeSource})`; }
      const dlaReasonText = dlaReason ? dlaReason.split('\n').map(l => `   ○ ${l}`).join('\n') : '   ○ NIL'; const dlaTimeStr = getDlaTimeStr() || '00HR 00MINS';
      blocks.push({ title: "DLA TIME N RSN", content: `   ○ DLA TIME : ${dlaTimeStr}\n${dlaNoticeText}\n${dlaReasonText}` });
    }
    blocks.push({ title: "PAX STS", content: `   ○ CFG : ${cfg || '미입력'}\n   ○ BKG : ${isFerry ? '0' : bkg || '미입력'}\n   ○ OBD(INF 제외) : ${getFormattedObd() || '미입력'}` });
    blocks.push({ title: "PAX H/D STS", content: formattedTimelineLines || '   ○ NIL' });
    if (isOfld || fhrType === 'BUS HNDL') {
      if (isOfld) { const displayName = (fhrPaxNm && fhrPaxNm.trim() !== '') ? fhrPaxNm : '미입력'; const displayCount = (fhrPaxCount && parseInt(fhrPaxCount, 10) > 0) ? fhrPaxCount : '1'; blocks.push({ title: "PAX NM", content: `   ○ ${displayName} *TCP ${displayCount}` }); }
      blocks.push({ title: "ACTN TAKEN", content: fhrActn ? fhrActn.split('\n').map(l => `   ○ ${l}`).join('\n') : '   ○ NIL' });
    }
    blocks.push({ title: "OTHR SPCL / COMPLAIN", content: othrSpclText });
    blocks.push({ title: "H/D TIME", content: hdTimeLines || '   ○ NIL' });
    blocks.push({ title: "ADD MAN", content: addManText });

    const body = blocks.map((b, i) => `${i + 1}. ${b.title}\n${b.content}`).join('\n\n');
    let ccAddress = '인천진에어 <icnlj@airkorea.biz>'; if (airline === 'RS') ccAddress = '인천그룹사 총괄 <icnljofc2@airkorea.biz>, ICNRS <icnrs@airkorea.biz>'; if (airline === 'BX') ccAddress = '인천그룹사 총괄 <icnljofc2@airkorea.biz>, ICNBX <icnbxak@airkorea.biz>';
    const emailHeader = `받는 사람 :\n수입관리 <income@airkorea.biz>, 지연레포트 <fhr@airkorea.biz>\n참조 :\n${ccAddress}\n제목 :\n${subject}\n\n────────────────────────────────────────\n      ✂️ 수신처 및 제목 복붙 후 지워주세요 ✂️      \n────────────────────────────────────────`;
    const pureBodyOnly = `${emailHeader}\n\n\u200B\n${body}\n\nB/RGDS//${writerName ? writerName.toUpperCase() : '이름입력필요'} (${writerPhone || '번호입력필요'})`;
    return { bodyOnlyText: pureBodyOnly };
  };

  const handleOpenPreview = () => {
    try {
      const errors: string[] = []; const isFhr = reportMode === 'FHR';
      if (!flightNum) errors.push('편명'); if (!date) errors.push('운항일'); if (!getOriginCode() || getOriginCode() === 'XXX') errors.push('출발지'); if (!getDestCode() || getDestCode() === 'XXX') errors.push('도착지'); if (!getFinalAcType()) errors.push('A/C TYPE'); if (!regNo || regNo.length < 4) errors.push('REG(기호 4자리)'); if (!spot) errors.push('SPOT'); if (!std) errors.push(lblS); if (!etd) errors.push(lblE); if (!atd) errors.push(lblA); if (!cfg) errors.push('CFG');
      if (!isFerry && !bkg) errors.push('BKG'); if (!isFerry && !obd) errors.push('OBD');
      if (timeline.some(t => t.time.length < 4)) errors.push('타임라인 미수정 "시간" 존재');
      if (!isFhr) { if (!dlaSummary || dlaSummary.trim() === '인한 출발 지연') errors.push('지연 요약(제목용)'); if (dlaNoticeSource !== 'NIL' && !dlaNoticeTime) errors.push('DLA SET NOTICE 시간'); if (!dlaReason || dlaReason.trim() === '인한 출발 지연') errors.push('지연 사유(상세)'); }
      if (isFhr && (fhrType === '자발적 하기' || fhrType === '비자발적 하기')) { if (!fhrPaxNm || fhrPaxNm.trim() === '') errors.push('해당 승객 이름 (PAX NM)'); if (!fhrPaxCount || fhrPaxCount.trim() === '' || parseInt(fhrPaxCount, 10) < 1) { errors.push('인원(TCP) (1명 이상 필수)'); } }
      if (isEdiRequired()) { const hasEdiStaff = addManList.some(s => s.role === 'EDI' && s.name.trim() !== ''); if (!hasEdiStaff) { errors.push(reportMode === 'FDR' ? 'EDI(오피스) 직원 [FDR 출항보고 필수]' : 'EDI(오피스) 직원 [국제선 FERRY 출/입항보고 필수]'); } }
      if (!writerName) errors.push('작성자 이름 (영문 권장)'); if (!writerPhone) errors.push('작성자 전화번호');
      setMissingFields(errors); setPreviewText(generateMailContent().bodyOnlyText); setShowPreviewModal(true);
    } catch (err: any) { alert("모달 오류: " + err.message); }
  };

  const handleFinalCopy = async () => {
    try { await navigator.clipboard.writeText(previewText); alert('✅ [전체 내용]이 완벽하게 복사되었습니다!\n메일 본문란에 바로 붙여넣기 하세요.'); handleSaveName(introWriterName.trim() || writerName.trim()); sendLogToGoogleSheet(previewText); saveToLocalStorage(false); setShowPreviewModal(false); } 
    catch { alert('🚨 자동 복사를 지원하지 않는 브라우저(카카오톡 등)입니다.\n\n상단의 본문 텍스트를 길게 눌러서 [전체 선택] 후 직접 복사해 주세요.'); }
  };

  const hasKoreanName = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(writerName);
  const isObdExceedsCfg = cfg && obd && !isFerry && (parseInt(obd, 10) > parseInt(cfg, 10));

  const getAirlineStyle = (code: string) => {
    if (code === 'LJ') return { bg: 'bg-lime-100 text-lime-800 border-lime-300', badge: 'bg-lime-500 text-white', selectBg: 'bg-lime-50 text-lime-900 border-lime-400' };
    if (code === 'RS') return { bg: 'bg-teal-100 text-teal-800 border-teal-300', badge: 'bg-teal-600 text-white', selectBg: 'bg-teal-50 text-teal-900 border-teal-400' };
    if (code === 'BX') return { bg: 'bg-sky-100 text-sky-800 border-sky-300', badge: 'bg-sky-500 text-white', selectBg: 'bg-sky-50 text-sky-900 border-sky-400' };
    return { bg: 'bg-gray-100 text-gray-700 border-gray-300', badge: 'bg-gray-500 text-white', selectBg: 'bg-white' };
  };
  const currentAlStyle = getAirlineStyle(airline);

  const InfoBtn = ({ code }: { code: string }) => {
    const info = FIELD_TOOLTIPS[code]; if (!info) return null;
    return ( <button type="button" onClick={(e) => { e.stopPropagation(); setActiveTooltip(info); }} className="ml-1 text-gray-400 hover:text-blue-600 font-bold text-[12px] cursor-pointer inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-100 hover:bg-blue-100 border border-gray-300" title={info.title}>ⓘ</button> );
  };

  const checkSection = (sec: number): string[] => {
    const errs: string[] = [];
    switch(sec) {
      case 1:
        if (!flightNum) errs.push('편명을 입력해주세요.');
        if (!date) errs.push('운항일을 선택해주세요.');
        break;
      case 2:
        if (getOriginCode() === 'XXX' || !originType) errs.push('출발지를 입력해주세요.');
        if (getDestCode() === 'XXX' || !destType) errs.push('도착지를 입력해주세요.');
        break;
      case 3:
        if (regNo.length !== 4) errs.push('REG No 4자리를 정확히 입력해주세요.');
        if (!getFinalAcType()) errs.push('기종(A/C TYPE)을 입력해주세요.');
        if (!cfg) errs.push('CFG(가용좌석)를 입력해주세요.');
        if (!spot) errs.push('SPOT 번호를 입력해주세요.');
        break;
      case 4:
        if (std.length !== 4) errs.push(`[오류] ${lblS} 시간을 완벽히 입력해주세요.`);
        if (etd.length !== 4) errs.push(`[오류] ${lblE} 시간을 완벽히 입력해주세요.`);
        if (atd.length !== 4) errs.push(`[오류] ${lblA} 시간을 완벽히 입력해주세요.`);
        break;
      case 5:
        if (!isFerry && !bkg) errs.push('BKG(예약 승객) 수를 입력해주세요.');
        if (!isFerry && !obd) errs.push('OBD(탑승 승객) 수를 입력해주세요.');
        if (isObdExceedsCfg) errs.push('[오류] 탑승객(OBD)이 가용좌석(CFG)을 초과했습니다.');
        break;
      case 6:
        if (reportMode === 'FDR') {
          if (!dlaSummary || dlaSummary.trim() === '인한 출발 지연') errs.push('지연 요약(제목)을 입력해주세요.');
          if (!dlaReason || dlaReason.trim() === '인한 출발 지연') errs.push('지연 상세 사유를 입력해주세요.');
          if (dlaNoticeSource !== 'NIL' && dlaNoticeTime.length !== 4) errs.push('DLA 통보 시간을 4자리로 입력해주세요.');
        } else {
          if (!fhrSubjectSummary) errs.push('보고 요약(제목)을 입력해주세요.');
          if ((fhrType === '자발적 하기' || fhrType === '비자발적 하기') && !fhrPaxNm) errs.push('해당 승객 이름을 입력해주세요.');
          if (!fhrRzn && !['FERRY OUT', 'FERRY IN'].includes(fhrType)) errs.push('상세 사유 경위를 입력해주세요.');
        }
        break;
      case 7:
        if (timeline.length === 0) errs.push('타임라인 항목이 하나 이상 필요합니다.');
        if (timeline.some(t => t.time && t.time.length < 4)) errs.push('[오류] 타임라인 시간은 4자리여야 합니다.');
        if (timeline.some(t => !t.time)) errs.push('시간이 비어있는 타임라인 항목이 있습니다.');
        break;
      case 8:
        const validHd = hdTimes.filter(h => h.name && h.start.length === 4 && h.end.length === 4);
        const partialHd = hdTimes.filter(h => (h.name || h.start || h.end) && !(h.name && h.start.length === 4 && h.end.length === 4));
        if (partialHd.length > 0) errs.push('[오류] 누락된 직원 H/D TIME 데이터가 있습니다.');
        if (validHd.length === 0) errs.push('최소 1명 이상의 H/D TIME을 완벽히 입력해주세요.');
        break;
      case 9:
        const validAdd = addManList.filter(a => a.name && a.start.length === 4 && a.end.length === 4);
        const partialAdd = addManList.filter(a => (a.name || a.start || a.end) && !(a.name && a.start.length === 4 && a.end.length === 4));
        if (partialAdd.length > 0) errs.push('[오류] 누락된 ADD MAN TIME 데이터가 있습니다.');
        if (isEdiRequired() && !validAdd.some(a => a.role === 'EDI')) errs.push('[오류] EDI(오피스) 직원의 추가 인력 보고는 필수입니다.');
        break;
      case 10:
        if (!writerName) errs.push('작성자 이름을 입력해주세요.');
        if (!writerPhone) errs.push('작성자 전화번호를 입력해주세요.');
        break;
    }
    return errs;
  };

  const handleNextStep = (currentSec: number) => {
    const errs = checkSection(currentSec);
    setSectionErrors(prev => ({...prev, [currentSec]: errs}));
    
    if (errs.length > 0) {
      if (currentSec === 4) {
        triggerTimeAlert('🚨 운항 시간을 완벽히 입력해야 다음 단계로 진행할 수 있습니다.');
        return; 
      }
      if (errs.some(e => e.includes('[오류]'))) triggerTimeAlert('🚨 오류가 있지만 다음 단계로 진행합니다.');
      else triggerTimeAlert('⚠️ 미입력 상태로 다음 단계로 진행합니다.');
    }

    const nextSec = currentSec + 1;
    if (nextSec <= 10) {
      setMaxUnlockedSection(prev => Math.max(prev, nextSec));
      setActiveSection(nextSec);
      setTimeout(() => {
        document.getElementById(`section-${nextSec}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const getBadge = (sec: number) => {
    const errs = sectionErrors[sec];
    if (errs === undefined) return <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-bold border border-gray-200">입력 대기</span>;
    if (errs.length === 0) return <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-extrabold shadow-sm border border-green-200 flex items-center gap-0.5">✓ 완료</span>;
    if (errs.some(e => e.includes('[오류]'))) return <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-extrabold shadow-sm border border-red-200 flex items-center gap-0.5"><span>🚨</span> 오류</span>;
    return <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-extrabold shadow-sm border border-orange-200 flex items-center gap-0.5"><span>⚠️</span> 미입력</span>;
  };

  const renderErrorBox = (sec: number) => {
    const errs = sectionErrors[sec];
    if (!errs || errs.length === 0) return null;
    return (
      <div className="bg-red-50 border border-red-200 p-2.5 rounded-lg mb-3 shadow-sm">
        <span className="text-red-700 font-extrabold text-[12px] block mb-1">🚨 확인 필요한 항목이 있습니다.</span>
        <ul className="text-red-600 text-[11px] font-bold space-y-1 pl-4 list-disc">
          {errs.map((err, i) => <li key={i}>{err.replace('[오류] ', '')}</li>)}
        </ul>
      </div>
    );
  };

  if (step === 'intro') {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen text-slate-800 flex flex-col justify-between p-6 font-sans relative">
        <div className="space-y-6 pt-6">
          <div className="flex justify-between items-center">
            <span className="bg-blue-100 text-blue-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest">AIR KOREA GROUND HANDLING</span>
            <button type="button" onClick={() => setShowAdminModal(true)} className="text-[10px] text-gray-400 hover:text-slate-700 underline cursor-pointer">(관리자)</button>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 leading-snug">✈️에어코리아 인천 그룹사지원센터</h1>
            <h2 className="text-xl font-black tracking-tight text-slate-900 leading-snug w-full">Smart Flight Irregularity Report Tool</h2>
            <p className="text-slate-500 text-xs pt-1">현업 실무 환경에 맞춘 빠르고 정확한 FDR / FHR 작성 도구입니다.</p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-4 shadow-sm">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 block">보고서 종류 선택</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => handleReportModeChange('FDR')} className={`py-3 px-2 rounded-xl font-bold transition flex flex-col items-center justify-center gap-0.5 border cursor-pointer ${reportMode === 'FDR' ? 'bg-red-500 text-white border-red-500 shadow-md' : 'bg-white text-slate-700 border-gray-200 hover:bg-red-50'}`}>
                  <span className="text-sm">FDR</span><span className={`text-[9px] font-medium tracking-tighter ${reportMode === 'FDR' ? 'text-red-100' : 'text-slate-400'}`}>FLIGHT DELAY REPORT</span>
                </button>
                <button type="button" onClick={() => handleReportModeChange('FHR')} className={`py-3 px-2 rounded-xl font-bold transition flex flex-col items-center justify-center gap-0.5 border cursor-pointer ${reportMode === 'FHR' ? 'bg-blue-500 text-white border-blue-500 shadow-md' : 'bg-white text-slate-700 border-gray-200 hover:bg-blue-50'}`}>
                  <span className="text-sm">FHR</span><span className={`text-[9px] font-medium tracking-tighter ${reportMode === 'FHR' ? 'text-blue-100' : 'text-slate-400'}`}>FLIGHT HANDLING REPORT</span>
                </button>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-red-600 block">운항일 확인 (날짜 주의)</label>
              <div className="flex justify-center items-center w-full border border-red-300 bg-red-50 rounded-xl h-12">
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-transparent text-red-900 font-bold text-[14px] outline-none text-center cursor-pointer px-4 w-full" style={{ textAlignLast: 'center' }} />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 block">담당 및 보고 직원 이름</label>
              <div className="flex gap-2">
                <select value={airline} onChange={handleAirlineChange} className={`w-1/3 border rounded-xl px-2 py-3 text-sm font-extrabold outline-none shadow-inner cursor-pointer transition-colors ${currentAlStyle.selectBg}`}>
                  <option value="LJ" className="bg-white text-slate-800">LJ (진에어)</option><option value="RS" className="bg-white text-slate-800">RS (에어서울)</option><option value="BX" className="bg-white text-slate-800">BX (에어부산)</option>
                </select>
                <input type="text" placeholder="보고 직원 이름" value={introWriterName} onChange={e => setIntroWriterName(e.target.value)} className="w-2/3 bg-white border border-gray-300 rounded-xl px-3 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 shadow-inner placeholder-gray-400" />
              </div>
              {savedNames.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5 items-center">
                  <span className="text-[10px] text-gray-400 font-semibold mr-1">최근 사용:</span>
                  {savedNames.map(n => (<button key={n} type="button" onClick={() => setIntroWriterName(n)} className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 hover:bg-blue-100 cursor-pointer transition"><span>{n}</span><span onClick={(e) => removeSavedName(n, e)} className="text-blue-300 hover:text-red-500 font-normal ml-0.5" title="기록 삭제">×</span></button>))}
                </div>
              )}
            </div>
          </div>

          {reportMode === 'FDR' && (
            <div className="mt-2 p-2.5 border border-red-200 rounded-xl bg-red-50/50 shadow-sm animate-fade-in">
              <label className="text-[13px] font-extrabold text-red-800 block mb-1 flex items-center gap-1">🚨 FDR 작성 기준 안내</label>
              <p className="text-[12px] font-bold text-red-600 tracking-tight whitespace-nowrap overflow-x-auto">
                FDR은 STD(출발 예정 시간)으로부터 <span className="font-extrabold underline">1시간 초과 지연되었을 시</span> 작성합니다.
              </p>
            </div>
          )}

          {reportMode === 'FHR' && (
            <div className="p-3 border border-blue-200 rounded-2xl bg-blue-50/50 shadow-sm animate-fade-in">
              <label className="text-[12px] font-extrabold text-blue-900 block mb-2">FHR 세부 유형 선택</label>
              <select value={fhrType} onChange={handleFhrTypeChange} className="w-full border border-blue-300 p-3 rounded-xl font-bold bg-white text-blue-900 text-[14px] cursor-pointer outline-none shadow-sm">
                <option value="FERRY OUT">FERRY OUT (출항)</option>
                <option value="FERRY IN">FERRY IN (입항)</option>
                <option value="자발적 하기">자발적 하기 (OFLD)</option>
                <option value="비자발적 하기">비자발적 하기 (OFLD)</option>
                <option value="RAMP RETURN">RAMP RETURN</option>
                <option value="DIVERT">DIVERT (회항)</option>
                <option value="결항">CNXL (결항)</option>
                <option value="BUS HNDL">BUS HNDL (심야버스)</option>
                <option value="기타(직접 입력)">기타 (직접 입력)</option>
              </select>

              {(fhrType === 'FERRY OUT' || fhrType === 'FERRY IN') && (
                <div className="mt-3 pt-3 border-t border-blue-200 flex flex-col gap-2">
                  <span className="text-[11px] font-extrabold text-blue-800">운항 성격 (EDI 필수 여부 반영)</span>
                  <div className="flex gap-4">
                    <label className="text-[12px] font-bold text-gray-700 flex items-center gap-1.5 cursor-pointer"><input type="radio" value="국제선" checked={ferryType === '국제선'} onChange={e => setFerryType(e.target.value)} className="accent-blue-600 w-4 h-4" /> 국제선</label>
                    <label className="text-[12px] font-bold text-gray-700 flex items-center gap-1.5 cursor-pointer"><input type="radio" value="국제선(중정비)" checked={ferryType === '국제선(중정비)'} onChange={e => setFerryType(e.target.value)} className="accent-blue-600 w-4 h-4" /> 국제선(중정비)</label>
                    <label className="text-[12px] font-bold text-gray-700 flex items-center gap-1.5 cursor-pointer"><input type="radio" value="국내선" checked={ferryType === '국내선'} onChange={e => setFerryType(e.target.value)} className="accent-blue-600 w-4 h-4" /> 국내선</label>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pb-4 pt-2 space-y-2">
          <button type="button" onClick={() => { if (!introWriterName.trim()) { alert('보고 직원 이름을 입력해 주세요.'); return; } handleSaveName(introWriterName); sendIntroLogToGoogleSheet(introWriterName, reportMode, airline); setStep('main'); }} className={`w-full text-white py-4 rounded-2xl font-bold text-sm shadow-xl active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer ${reportMode === 'FDR' ? 'bg-red-500 hover:bg-red-400' : 'bg-blue-500 hover:bg-blue-400'}`}>
            <span>{reportMode} 새롭게 작성 시작하기</span><span>→</span>
          </button>
          <button type="button" onClick={() => setStep('myRecords')} className="w-full text-slate-700 bg-white border border-gray-300 py-3 rounded-2xl font-bold text-sm shadow-sm active:bg-gray-50 transition flex items-center justify-center gap-2 cursor-pointer mt-1"><span>💾 내 기기에 저장된 기록 불러오기</span></button>
          <button type="button" onClick={() => setShowGuideModal(true)} className="w-full text-gray-500 bg-gray-50 border border-gray-200 py-2.5 rounded-2xl font-bold text-xs shadow-sm hover:bg-gray-100 transition flex items-center justify-center gap-1.5 cursor-pointer mt-1"><span>📖 작성 가이드 및 주의사항 확인하기</span></button>
          <div className="flex flex-col items-center gap-1.5 mt-2">
            <div className="text-center text-[10px] text-gray-400 font-mono">CREATED BY SH.CHO (Ver 2.0)</div>
            <button type="button" onClick={() => window.open('mailto:shcho1219@airkorea.biz?subject=[스마트 리포트 툴] 오류 제보 및 건의사항')} className="text-[10px] text-gray-500 underline hover:text-gray-700 cursor-pointer">💡 시스템 오류 제보 및 건의사항 남기기</button>
          </div>
        </div>

        {/* 🌟 관리자 인증 모달 추가 */}
        {showAdminModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
              <h3 className="font-extrabold text-lg text-slate-900">🔒 관리자 인증</h3>
              <p className="text-xs text-gray-500">통합 클라우드 대시보드에 접근하려면 관리자 비밀번호를 입력하세요.</p>
              <input 
                type="password" 
                value={adminPwInput} 
                onChange={e => {
                  const val = e.target.value;
                  setAdminPwInput(val);
                  // 🌟 타이핑 즉시 검사: 0000이 완성되면 자동 접속
                  if (val === '1017') {
                    setShowAdminModal(false);
                    setAdminPwInput('');
                    setStep('logs');
                  }
                }} 
                onKeyDown={e => { if (e.key === 'Enter') handleAdminLogin(); }}
                placeholder="비밀번호 입력" 
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-slate-800 outline-none text-center tracking-widest font-bold"
                autoFocus
              />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setShowAdminModal(false); setAdminPwInput(''); }} className="w-1/3 py-2.5 rounded-lg font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition cursor-pointer">취소</button>
                <button type="button" onClick={handleAdminLogin} className="w-2/3 py-2.5 rounded-lg font-bold text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer">대시보드 접속</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- myRecords, logs 생략 ---
  if (step === 'myRecords') { 
    const filteredRecords = localRecords.filter((record) => {
      const q = recordSearchQuery.toLowerCase();
      return (record.summaryTitle.toLowerCase().includes(q) || record.detail.toLowerCase().includes(q) || record.timestamp.toLowerCase().includes(q));
    });
    return (
      <div className="max-w-md mx-auto bg-gray-50 min-h-screen text-slate-800 p-4 font-sans flex flex-col">
        <div className="flex justify-between items-center mb-3 border-b pb-3"><h2 className="font-extrabold text-[15px] text-slate-900">💾 나의 기기 저장 기록</h2><button type="button" onClick={() => setStep('intro')} className="bg-slate-800 text-white px-3 py-1.5 rounded-lg font-bold text-[11px] cursor-pointer">← 홈으로</button></div>
        <div className="mb-3"><input type="text" placeholder="🔍 편명, 날짜 또는 사유로 검색..." value={recordSearchQuery} onChange={(e) => setRecordSearchQuery(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 shadow-inner" /></div>
        {filteredRecords.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2"><span className="text-3xl">📭</span><span className="text-sm font-bold">검색 결과가 없습니다.</span></div>
        ) : (
          <div className="space-y-2 overflow-y-auto pb-8 flex-1">
            {filteredRecords.map((record) => (
              <div key={record.id} className={`bg-white border rounded-xl p-3 shadow-sm flex flex-col gap-2 ${record.summaryTitle.includes('⚠️ [임시저장]') ? 'border-orange-300 bg-orange-50/30' : ''}`}>
                <div className="flex justify-between items-start">
                  <div className="flex flex-col"><span className="text-[10px] text-gray-400 mb-0.5">{record.timestamp}</span><span className={`font-extrabold text-sm ${record.summaryTitle.includes('⚠️ [임시저장]') ? 'text-orange-600' : 'text-slate-800'}`}>{record.summaryTitle}</span><span className="text-[11px] text-gray-600 mt-0.5 break-all line-clamp-1">{record.detail}</span></div>
                  <button type="button" onClick={() => deleteLocalRecord(record.id)} className="text-red-400 hover:text-red-600 p-1 cursor-pointer" title="기록 삭제">🗑️</button>
                </div>
                <button type="button" onClick={() => handleLoadRecord(record.state)} className={`w-full font-bold py-2.5 rounded-lg text-[12px] transition cursor-pointer ${record.summaryTitle.includes('⚠️ [임시저장]') ? 'bg-orange-100 text-orange-800 hover:bg-orange-200 border border-orange-200' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'}`}>이 양식 그대로 불러오기</button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (step === 'logs') { 
    return (
      <div className="max-w-7xl mx-auto bg-gray-50 min-h-screen text-slate-800 p-4 font-sans text-xs">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <div className="flex items-center gap-3"><h2 className="font-extrabold text-sm text-slate-900">📊 ☁️ 통합 클라우드 대시보드 (구글 시트 연동)</h2><button type="button" onClick={fetchLogsFromSheet} className="bg-green-50 text-green-700 border border-green-200 px-2.5 py-1.5 rounded-lg font-bold text-[11px] hover:bg-green-100 cursor-pointer flex items-center gap-1">🔄 데이터 새로고침</button></div>
          <button type="button" onClick={() => setStep('intro')} className="bg-slate-800 text-white px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer">돌아가기</button>
        </div>
        {isLoadingLogs ? ( <div className="bg-white p-12 rounded-xl text-center text-blue-600 font-bold border shadow-sm text-sm">클라우드(구글 시트)에서 실시간 데이터를 불러오는 중입니다...</div> ) : sheetLogs.length === 0 ? ( <div className="bg-white p-8 rounded-xl text-center text-gray-400 border shadow-sm text-sm">아직 구글 시트에 기록된 로그가 없습니다.</div> ) : (
          <div className="overflow-x-auto bg-white rounded-xl border shadow-sm">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead><tr className="bg-slate-100 text-slate-700 text-[11px] border-b"><th className="p-3 font-extrabold text-blue-900">순번</th><th className="p-3 font-extrabold text-blue-900">보고 직원 이름</th><th className="p-3 font-bold">작성 일시</th><th className="p-3 font-bold">보고서</th><th className="p-3 font-bold">편명</th><th className="p-3 font-bold">운항일</th><th className="p-3 font-bold">구간</th><th className="p-3 font-bold">기종</th><th className="p-3 font-bold">REG</th><th className="p-3 font-bold">SPOT</th><th className="p-3 font-bold">CFG / BKG / OBD</th><th className="p-3 font-bold">지연요약/FHR유형</th><th className="p-3 font-bold">연락처</th></tr></thead>
              <tbody className="divide-y text-[11px] text-slate-800">
                {sheetLogs.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-extrabold text-slate-500 bg-slate-50">{row[0] || '-'}</td><td className="p-3 font-extrabold text-blue-900 bg-blue-50/50">{row[2] || '-'}</td><td className="p-3 font-mono text-gray-500 text-[10px]">{row[1] || '-'}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${row[3] === 'FDR' ? 'bg-red-500' : 'bg-blue-500'}`}>{row[3] || '-'}</span></td>
                    <td className="p-3 font-bold">{row[4] || '-'}</td><td className="p-3">{row[5] || '-'}</td><td className="p-3 font-mono font-semibold">{row[6] || '-'}</td><td className="p-3">{row[7] || '-'}</td><td className="p-3 font-mono">{row[8] || '-'}</td><td className="p-3">{row[9] || '-'}</td><td className="p-3 font-mono">{row[10] || '-'}</td><td className="p-3 text-slate-800 font-semibold">{row[11] || '-'}</td><td className="p-3 font-mono text-gray-600">{row[12] || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-gray-100 min-h-screen text-slate-800 pb-28 font-sans antialiased text-xs relative">
      
      {activeTooltip && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-5 w-full max-w-xs shadow-2xl space-y-3 border">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-extrabold text-sm text-blue-900 flex items-center gap-1"><span>💡</span> {activeTooltip.title}</h4>
              <button type="button" onClick={() => setActiveTooltip(null)} className="text-gray-400 hover:text-slate-800 text-xl leading-none cursor-pointer">&times;</button>
            </div>
            <p className="text-[12px] text-slate-700 leading-relaxed pt-1">{activeTooltip.desc}</p>
            <button type="button" onClick={() => setActiveTooltip(null)} className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-bold text-sm shadow mt-2 cursor-pointer">확인</button>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 bg-white shadow-sm flex flex-col border-b">
        <div className="flex items-center justify-between p-2.5">
          <button type="button" onClick={() => { if (window.confirm("초기 화면으로 돌아가시겠습니까?\n작성된 내용이 지워집니다.")) { clearFormFields(); setStep('intro'); } }} className="text-[11px] font-bold text-slate-600 bg-gray-100 px-3 py-1.5 rounded shadow-sm hover:bg-gray-200 cursor-pointer transition">
            ← 처음으로
          </button>
          <span className={`font-extrabold tracking-wider text-[13px] px-3 py-1 rounded shadow-sm text-white ${reportMode === 'FDR' ? 'bg-red-500' : 'bg-blue-500'}`}>
            {reportMode} 작성중
          </span>
          <span className="text-[11px] text-gray-500 font-extrabold">
            {airline} {introWriterName || '미입력'}
          </span>
        </div>
        
        <div className="bg-slate-800 text-gray-200 text-[12px] font-mono flex flex-col px-3.5 py-2.5 shadow-md gap-1">
          <div className="flex justify-between items-center font-bold">
            <span className="text-white">{hudFlight}/{hudDate} {hudRoute}</span>
            <span className="text-gray-300">REG No: {hudReg} / 기종: {hudAc}</span>
          </div>
          <div className="flex justify-between items-center text-[12px]">
            <span className="text-gray-300">CFG: {hudCfg} / SPOT #{hudSpot}</span>
            <span className="flex gap-2">
              <span className="text-gray-300">S: {hudStd}</span>
              <span className="text-gray-300">E: {hudEtd}</span>
              <span className="text-yellow-300 font-extrabold">A: {hudAtd}</span>
            </span>
          </div>
        </div>
      </header>

      <main className="p-3 space-y-3">

        {/* STEP 1: 기본 운항 정보 */}
        {maxUnlockedSection >= 1 && (
          <div id="section-1" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <button onClick={() => toggleSection(1)} className={`w-full flex justify-between items-center transition-colors ${activeSection === 1 ? 'p-3.5 bg-gray-50 hover:bg-gray-100' : 'py-2 px-3 bg-white hover:bg-gray-50'}`}>
              <span className={`transition-all ${activeSection === 1 ? 'font-extrabold text-[14px] text-slate-800' : 'font-bold text-[11px] text-gray-400'}`}>기본 운항 정보</span>
              {getBadge(1)}
            </button>
            {activeSection === 1 && (
              <div className="p-3 border-t border-gray-100 space-y-3">
                {renderErrorBox(1)}
                <div className="grid grid-cols-2 gap-2 text-left">
                  <div className="flex flex-col">
                    <label className="text-[11px] text-gray-500 font-bold block mb-1">편명</label>
                    <div className="flex border rounded-lg bg-white overflow-hidden h-12">
                      <span className={`font-extrabold text-[13px] px-3 min-w-[48px] border-r flex items-center justify-center tracking-wider transition-colors ${currentAlStyle.bg}`}>{airline}</span>
                      <input type="text" placeholder="001" value={flightNum} onChange={e => setFlightNum(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, ''))} className="w-full px-2 text-center outline-none text-[15px] uppercase font-bold" />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[11px] text-red-600 font-bold block mb-1">운항일</label>
                    <div className="flex justify-center items-center w-full border border-red-300 bg-red-50 rounded-lg h-12">
                      <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-transparent text-red-900 font-bold text-[14px] outline-none text-center cursor-pointer w-full px-2" style={{ textAlignLast: 'center' }} />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-3 border-t border-gray-100 mt-3">
                  <button onClick={() => handleNextStep(1)} className="text-[13px] bg-slate-800 text-white px-5 py-2.5 rounded-lg shadow cursor-pointer font-bold">다음 단계 ➡️</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: 구간 */}
        {maxUnlockedSection >= 2 && (
          <div id="section-2" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <button onClick={() => toggleSection(2)} className={`w-full flex justify-between items-center transition-colors ${activeSection === 2 ? 'p-3.5 bg-gray-50 hover:bg-gray-100' : 'py-2 px-3 bg-white hover:bg-gray-50'}`}>
              <span className={`transition-all ${activeSection === 2 ? 'font-extrabold text-[14px] text-slate-800' : 'font-bold text-[11px] text-gray-400'}`}>구간 (출발 - 도착)</span>
              {getBadge(2)}
            </button>
            {activeSection === 2 && (
              <div className="p-3 border-t border-gray-100 space-y-3">
                {renderErrorBox(2)}
                <div className="flex flex-col">
                  <div className="flex items-center gap-1 h-12">
                    <div className="flex-1 flex border rounded-lg bg-white h-full overflow-hidden">
                      <select value={originType} onChange={e => setOriginType(e.target.value)} className="bg-blue-50 text-blue-900 font-bold text-[12px] px-1.5 border-r outline-none cursor-pointer">
                        <option value="ICN">ICN</option><option value="GMP">GMP</option><option value="CUSTOM">직접 입력</option>
                      </select>
                      {originType === 'CUSTOM' ? (
                        <input type="text" maxLength={3} placeholder="출발" value={originCustom} onChange={e => setOriginCustom(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))} className="w-full px-1 text-center outline-none text-[14px] uppercase font-bold" />
                      ) : (
                        <span className="w-full text-center flex items-center justify-center font-bold text-[14px] text-blue-700 bg-blue-50/30">{originType}</span>
                      )}
                    </div>
                    <span className="text-gray-400 font-bold text-[14px] px-2">▶</span>
                    <div className="flex-1 flex border rounded-lg bg-white h-full overflow-hidden">
                      <select value={destType} onChange={e => setDestType(e.target.value)} className="bg-indigo-50 text-indigo-900 font-bold text-[12px] px-1.5 border-r outline-none cursor-pointer">
                        <option value="CUSTOM">직접 입력</option><option value="ICN">ICN</option><option value="GMP">GMP</option>
                      </select>
                      {destType === 'CUSTOM' ? (
                        <input type="text" maxLength={3} placeholder="도착" value={destCustom} onChange={e => setDestCustom(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))} className="w-full px-1 text-center outline-none text-[14px] uppercase font-bold" />
                      ) : (
                        <span className="w-full text-center flex items-center justify-center font-bold text-[14px] text-indigo-700 bg-indigo-50/30">{destType}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-100 mt-3">
                  <button onClick={() => toggleSection(1)} className="text-[13px] bg-gray-200 text-gray-700 px-5 py-2.5 rounded-lg shadow-sm cursor-pointer font-bold">⬅️ 이전</button>
                  <button onClick={() => handleNextStep(2)} className="text-[13px] bg-slate-800 text-white px-5 py-2.5 rounded-lg shadow cursor-pointer font-bold">다음 단계 ➡️</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: 기재 및 SPOT 정보 */}
        {maxUnlockedSection >= 3 && (
          <div id="section-3" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <button onClick={() => toggleSection(3)} className={`w-full flex justify-between items-center transition-colors ${activeSection === 3 ? 'p-3.5 bg-gray-50 hover:bg-gray-100' : 'py-2 px-3 bg-white hover:bg-gray-50'}`}>
              <span className={`transition-all ${activeSection === 3 ? 'font-extrabold text-[14px] text-slate-800' : 'font-bold text-[11px] text-gray-400'}`}>기재 및 SPOT 정보</span>
              {getBadge(3)}
            </button>
            {activeSection === 3 && (
              <div className="p-3 border-t border-gray-100 space-y-3">
                {renderErrorBox(3)}
                <div className="grid grid-cols-4 gap-2 text-left">
                  <div className="col-span-1 flex flex-col">
                    <label className="text-[10px] text-gray-400 mb-1 font-bold flex items-center">REG No. <InfoBtn code="REG" /></label>
                    <div className="flex border rounded-lg bg-white overflow-hidden h-12">
                      <span className="bg-gray-100 text-gray-500 font-bold text-[10px] px-1 border-r flex items-center">HL</span>
                      <input type="text" inputMode="numeric" maxLength={4} placeholder="0000" value={regNo} onChange={e => setRegNo(e.target.value.replace(/[^0-9]/g, ''))} className="w-full px-1 text-center outline-none text-[14px] font-mono font-bold text-slate-800" />
                    </div>
                  </div>
                  <div className="col-span-1 flex flex-col">
                    <label className="text-[10px] text-gray-400 block mb-1 font-bold">A/C TYPE</label>
                    {acTypeSelect === 'CUSTOM' ? (
                      <div className="flex w-full h-12 bg-white border rounded-lg overflow-hidden">
                        <input type="text" placeholder="기종" value={acTypeCustom} onChange={e => handleOverrideCheck(e.target.value.toUpperCase(), setAcTypeCustom)} className="w-full px-1 outline-none text-[11px] font-bold text-center" />
                        <button type="button" onClick={() => handleOverrideCheck('', setAcTypeSelect)} className="bg-gray-200 px-2 text-[10px] font-bold hover:bg-red-200">X</button>
                      </div>
                    ) : (
                      <select value={acTypeSelect} onChange={handleAcTypeOverride} className="w-full border px-1 rounded-lg text-center text-[12px] bg-white font-bold text-blue-900 h-12 cursor-pointer">
                        <option value="">선택</option>
                        {acTypeOptions[airline].map(opt => (<option key={opt.label} value={opt.label}>{opt.label}</option>))}
                        <option value="CUSTOM">직접입력</option>
                      </select>
                    )}
                  </div>
                  <div className="col-span-1 flex flex-col">
                    <label className="text-[10px] text-gray-400 block mb-1 font-bold flex items-center">CFG <InfoBtn code="CFG" /></label>
                    <input type="text" value={cfg} onChange={handleCfgOverride} className="w-full border p-1 rounded-lg text-center bg-white font-extrabold text-blue-900 text-[14px] h-12" />
                  </div>
                  <div className="col-span-1 flex flex-col">
                    <label className="text-[10px] text-gray-400 block mb-1 font-bold flex items-center">SPOT <InfoBtn code="SPOT" /></label>
                    <input type="text" placeholder="208" value={spot} onChange={e => setSpot(e.target.value.toUpperCase())} className="w-full border rounded-lg text-center text-[14px] font-bold bg-white h-12 px-0 uppercase" />
                  </div>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-100 mt-3">
                  <button onClick={() => toggleSection(2)} className="text-[13px] bg-gray-200 text-gray-700 px-5 py-2.5 rounded-lg shadow-sm cursor-pointer font-bold">⬅️ 이전</button>
                  <button onClick={() => handleNextStep(3)} className="text-[13px] bg-slate-800 text-white px-5 py-2.5 rounded-lg shadow cursor-pointer font-bold">다음 단계 ➡️</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: 운항 시간 */}
        {maxUnlockedSection >= 4 && (
          <div id="section-4" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <button onClick={() => toggleSection(4)} className={`w-full flex justify-between items-center transition-colors ${activeSection === 4 ? 'p-3.5 bg-gray-50 hover:bg-gray-100' : 'py-2 px-3 bg-white hover:bg-gray-50'}`}>
              <span className={`transition-all ${activeSection === 4 ? 'font-extrabold text-[14px] text-slate-800' : 'font-bold text-[11px] text-gray-400'}`}>운항 시간 (S/E/A)</span>
              {getBadge(4)}
            </button>
            {activeSection === 4 && (
              <div className="p-3 border-t border-gray-100 space-y-3">
                {renderErrorBox(4)}
                <div className="grid grid-cols-3 gap-2 text-left">
                  <div className="col-span-1 flex flex-col">
                    <div className="flex justify-start items-center mb-1.5 h-[14px]">
                      <span className="text-[11px] text-gray-400 font-bold whitespace-nowrap flex items-center">{lblS} <InfoBtn code="STD" /></span>
                    </div>
                    <input type="text" inputMode="numeric" maxLength={4} placeholder="0000" value={std} onChange={e => handleFlightTimeInput(e.target.value, setStd)} className="w-full border rounded-lg text-center font-mono text-[16px] font-bold bg-white h-12 px-0" />
                  </div>
                  <div className="col-span-1 flex flex-col">
                    <div className="flex justify-between items-center mb-1.5 h-[14px] overflow-visible">
                      <span className="text-[11px] text-gray-400 font-bold whitespace-nowrap flex items-center">{lblE}<InfoBtn code="ETD" /></span>
                      <label className="text-[10px] text-blue-600 font-bold flex items-center cursor-pointer whitespace-nowrap"><input type="checkbox" checked={etdNextDay} onChange={e => setEtdNextDay(e.target.checked)} className="w-3.5 h-3.5 mr-0.5" />+1</label>
                    </div>
                    <input type="text" inputMode="numeric" maxLength={4} placeholder="0000" value={etd} onChange={e => handleFlightTimeInput(e.target.value, setEtd, setEtdNextDay)} className="w-full border rounded-lg text-center font-mono text-[16px] font-bold bg-white h-12 px-0" />
                  </div>
                  <div className="col-span-1 flex flex-col">
                    <div className="flex justify-between items-center mb-1.5 h-[14px] overflow-visible">
                      <span className="text-[11px] text-gray-400 font-bold whitespace-nowrap flex items-center">{lblA}<InfoBtn code="ATD" /></span>
                      <label className="text-[10px] text-blue-600 font-bold flex items-center cursor-pointer whitespace-nowrap"><input type="checkbox" checked={atdNextDay} onChange={e => setAtdNextDay(e.target.checked)} className="w-3.5 h-3.5 mr-0.5" />+1</label>
                    </div>
                    <input type="text" inputMode="numeric" maxLength={4} placeholder="0000" value={atd} onChange={e => handleFlightTimeInput(e.target.value, setAtd, setAtdNextDay)} className="w-full border rounded-lg text-center font-mono text-[16px] font-extrabold text-slate-900 bg-yellow-50 h-12 px-0 border-yellow-300" />
                  </div>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-100 mt-3">
                  <button onClick={() => toggleSection(3)} className="text-[13px] bg-gray-200 text-gray-700 px-5 py-2.5 rounded-lg shadow-sm cursor-pointer font-bold">⬅️ 이전</button>
                  <button onClick={() => handleNextStep(4)} className="text-[13px] bg-slate-800 text-white px-5 py-2.5 rounded-lg shadow cursor-pointer font-bold">다음 단계 ➡️</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 5: 승객 현황 */}
        {maxUnlockedSection >= 5 && (
          <div id="section-5" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <button onClick={() => toggleSection(5)} className={`w-full flex justify-between items-center transition-colors ${activeSection === 5 ? 'p-3.5 bg-gray-50 hover:bg-gray-100' : 'py-2 px-3 bg-white hover:bg-gray-50'}`}>
              <span className={`transition-all ${activeSection === 5 ? 'font-extrabold text-[14px] text-slate-800' : 'font-bold text-[11px] text-gray-400'}`}>승객 현황 (PAX)</span>
              {getBadge(5)}
            </button>
            {activeSection === 5 && (
              <div className="p-3 border-t border-gray-100 space-y-3">
                {renderErrorBox(5)}
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-gray-400 font-bold truncate flex items-center justify-between mb-1.5">BKG <InfoBtn code="BKG" /></span>
                    <input type="text" inputMode="numeric" placeholder="예: 180" value={isFerry ? '0' : bkg} onChange={e => { if (!isFerry) setBkg(e.target.value); }} className={`w-full border p-2 rounded-lg text-center text-[14px] h-12 placeholder-gray-300 font-bold ${isFerry ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'text-slate-800'}`} readOnly={isFerry} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-gray-400 font-bold truncate flex items-center justify-between mb-1.5">OBD(INF 제외) <InfoBtn code="OBD" /></span>
                    <input type="text" inputMode="numeric" placeholder="예: 180" value={isFerry ? '0' : obd} onChange={e => { if (!isFerry) setObd(e.target.value); }} className={`w-full border p-2 rounded-lg text-center text-[14px] h-12 font-bold ${isObdExceedsCfg ? 'bg-red-50 text-red-600 border-red-400' : isFerry ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'text-slate-800'}`} readOnly={isFerry} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-blue-600 font-bold truncate flex items-center justify-between mb-1.5">INF <InfoBtn code="INF" /></span>
                    <input type="text" inputMode="numeric" placeholder="INF" value={isFerry ? '0' : inf} onChange={e => { if (!isFerry) setInf(e.target.value.replace(/[^0-9]/g, '')); }} className={`w-full border p-2 rounded-lg text-center text-[14px] h-12 placeholder-gray-300 font-bold ${isFerry ? 'bg-gray-100 text-blue-300 cursor-not-allowed border-gray-200' : 'text-blue-700 bg-blue-50/50'}`} readOnly={isFerry} />
                  </div>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-100 mt-3">
                  <button onClick={() => toggleSection(4)} className="text-[13px] bg-gray-200 text-gray-700 px-5 py-2.5 rounded-lg shadow-sm cursor-pointer font-bold">⬅️ 이전</button>
                  <button onClick={() => handleNextStep(5)} className="text-[13px] bg-slate-800 text-white px-5 py-2.5 rounded-lg shadow cursor-pointer font-bold">다음 단계 ➡️</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 6: 사유 및 상세 내용 */}
        {maxUnlockedSection >= 6 && (
          <div id="section-6" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <button onClick={() => toggleSection(6)} className={`w-full flex justify-between items-center transition-colors ${activeSection === 6 ? 'p-3.5 bg-gray-50 hover:bg-gray-100' : 'py-2 px-3 bg-white hover:bg-gray-50'}`}>
              <span className={`transition-all ${activeSection === 6 ? 'font-extrabold text-[14px] text-slate-800' : 'font-bold text-[11px] text-gray-400'}`}>사유 및 상세 내용</span>
              {getBadge(6)}
            </button>
            {activeSection === 6 && (
              <div className="p-3 border-t border-gray-100 space-y-4">
                {renderErrorBox(6)}
                
                {reportMode === 'FDR' && (
                  <div className="bg-red-50/30 p-3 rounded-xl shadow-sm space-y-3 border border-red-100">
                    <div>
                      <label className="text-[12px] font-bold text-gray-700 block mb-1.5">지연 요약 (메일 제목용)</label>
                      <div className="flex flex-col gap-1.5">
                        <select value={dlaPreset} onChange={e => { const val = e.target.value; setDlaPreset(val); if (val !== '직접 입력') { setDlaSummary(val); setDlaReason(val); } else { setDlaSummary(' 인한 출발 지연'); setDlaReason(' 인한 출발 지연'); } }} className="w-full border p-2 rounded-lg text-[13px] font-bold text-red-900 bg-red-50 cursor-pointer outline-none">
                          <option value="항공기 연결 관계로 인한 출발 지연">항공기 연결 관계로 인한 출발 지연</option><option value="도착지 기상 관계로 인한 출발 지연">도착지 기상 관계로 인한 출발 지연</option><option value="출발지 기상 관계로 인한 출발 지연">출발지 기상 관계로 인한 출발 지연</option><option value="ATC HOLD로 인한 출발 지연">ATC HOLD로 인한 출발 지연</option><option value="항공기 정비로 인한 출발 지연">항공기 정비로 인한 출발 지연</option><option value="승객 자발적 하기로 인한 출발 지연">승객 자발적 하기로 인한 출발 지연</option><option value="승객 비자발적 하기로 인한 출발 지연">승객 비자발적 하기로 인한 출발 지연</option><option value="직접 입력">직접 입력</option>
                        </select>
                        <input type="text" value={dlaSummary} onChange={e => { setDlaSummary(e.target.value); setDlaPreset('직접 입력'); setDlaReason(e.target.value); }} placeholder="지연 요약 직접 입력" className="w-full border p-2 rounded-lg text-[13px] font-bold text-red-900 bg-white" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[12px] font-bold text-gray-700 block mb-1.5">DLA TIME (지연 시간)</label>
                      <div className="w-full border p-2 rounded-lg text-[13px] font-bold bg-gray-50 flex justify-between items-center shadow-inner h-10">
                        <span className="text-gray-500 text-[11px]">⏱️ 자동 계산됨</span>
                        <span className="text-red-600">{std.length === 4 && atd.length === 4 ? getDlaTimeStr() || '시간 확인 요망' : ''}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[12px] font-bold text-gray-700 mb-1.5 flex items-center">DLA SET NOTICE 통보 <InfoBtn code="DLA_NOTICE" /></label>
                      <div className="flex gap-2">
                        <select value={dlaNoticeSource} onChange={e => setDlaNoticeSource(e.target.value)} className={`border p-2 rounded-lg text-[13px] bg-white font-semibold cursor-pointer ${dlaNoticeSource === 'NIL' ? 'w-full' : 'w-1/2'}`}>
                          <option value="NIL">미 입력 시 NIL</option><option value={`BY ${airline} 운항통제`}>BY {airline} 운항통제</option><option value="BY ICNKK">BY ICNKK</option>
                        </select>
                        {dlaNoticeSource !== 'NIL' && (
                          <input type="text" inputMode="numeric" maxLength={4} placeholder="시간 (HHMM)" value={dlaNoticeTime} onChange={e => handleFlightTimeInput(e.target.value, setDlaNoticeTime)} className="w-1/2 border p-2 rounded-lg text-center font-mono text-[13px] font-bold" />
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-[12px] font-bold text-gray-700 block mb-1.5">지연 사유 (상세)</label>
                      <textarea rows={3} value={dlaReason} onChange={e => { setDlaReason(e.target.value); setDlaPreset('직접 입력'); }} placeholder="상세 지연 사유를 입력하세요" className="w-full border p-2 rounded-lg text-[13px]" />
                    </div>
                  </div>
                )}

                {reportMode === 'FHR' && (
                  <div className="bg-blue-50/30 p-3 rounded-xl shadow-sm space-y-3 border border-blue-100">
                    <div>
                      <label className="text-[12px] font-bold text-gray-700 block mb-1.5">보고 요약 (메일 제목용)</label>
                      <input type="text" value={fhrSubjectSummary} onChange={e => setFhrSubjectSummary(e.target.value)} className="w-full border p-2 rounded-lg text-[13px] font-bold text-blue-900 bg-blue-50" />
                    </div>
                    {(fhrType === '자발적 하기' || fhrType === '비자발적 하기') && (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="text-[11px] font-bold text-gray-600 block mb-1">해당 승객 이름</label>
                          <input type="text" value={fhrPaxNm} onChange={e => setFhrPaxNm(e.target.value)} placeholder="HONG / GILDONG" className="w-full border p-2 rounded-lg text-[13px] placeholder-gray-400 font-bold" />
                        </div>
                        <div className="col-span-1">
                          <label className="text-[11px] font-bold text-gray-600 block mb-1">인원(TCP)</label>
                          <input type="number" min="1" value={fhrPaxCount} onChange={e => { const val = e.target.value; if (val === '' || parseInt(val, 10) >= 1) { setFhrPaxCount(val); } else { setFhrPaxCount('1'); } }} placeholder="일행 수" className="w-full border p-2 rounded-lg text-[13px] placeholder-gray-400 font-bold text-center" />
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="text-[12px] font-bold text-gray-700 block mb-1.5">사유 경위 (상세)</label>
                      <textarea rows={3} value={fhrRzn} onChange={e => setFhrRzn(e.target.value)} placeholder="사유 입력 / 미 입력 시 NIL" className="w-full border p-2 rounded-lg text-[13px] placeholder-gray-400" />
                    </div>
                    {(fhrType === '자발적 하기' || fhrType === '비자발적 하기' || fhrType === 'BUS HNDL') && (
                      <div>
                        <label className="text-[12px] font-bold text-gray-700 block mb-1.5">ACTN TAKEN (조치 사항)</label>
                        <textarea rows={4} value={fhrActn} onChange={e => setFhrActn(e.target.value)} className="w-full border p-2 rounded-lg text-[13px]" />
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-gray-50 p-3 rounded-xl shadow-sm border border-gray-200 mt-2">
                  <label className="text-[12px] font-bold text-gray-700 block mb-1.5">OTHER SPCL (기타 특이사항)</label>
                  <textarea rows={2} placeholder="특이사항 한 줄씩 입력 / 미 입력 시 NIL" value={othrSpcl} onChange={e => setOthrSpcl(e.target.value)} className="w-full border p-2 rounded-lg text-[13px] placeholder-gray-400" />
                </div>

                <div className="flex justify-between pt-3 border-t border-gray-100 mt-3">
                  <button onClick={() => toggleSection(5)} className="text-[13px] bg-gray-200 text-gray-700 px-5 py-2.5 rounded-lg shadow-sm cursor-pointer font-bold">⬅️ 이전</button>
                  <button onClick={() => handleNextStep(6)} className="text-[13px] bg-slate-800 text-white px-5 py-2.5 rounded-lg shadow cursor-pointer font-bold">다음 단계 ➡️</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 7: PAX H/D STATUS (타임라인) */}
        {maxUnlockedSection >= 7 && (
          <div id="section-7" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <button onClick={() => toggleSection(7)} className={`w-full flex justify-between items-center transition-colors ${activeSection === 7 ? 'p-3.5 bg-gray-50 hover:bg-gray-100' : 'py-2 px-3 bg-white hover:bg-gray-50'}`}>
              <span className={`transition-all ${activeSection === 7 ? 'font-extrabold text-[14px] text-slate-800' : 'font-bold text-[11px] text-gray-400'}`}>PAX H/D STATUS</span>
              {getBadge(7)}
            </button>
            {activeSection === 7 && (
              <div className="p-3 border-t border-gray-100 space-y-3">
                {renderErrorBox(7)}
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[12px] font-bold text-gray-700">타임라인</label>
                  <button type="button" onClick={handleAddTimeline} className="text-[10px] font-bold bg-gray-200 text-gray-700 px-2.5 py-1.5 rounded-lg shadow-sm cursor-pointer">+ 하단 추가</button>
                </div>
                <div className="text-[10px] text-red-600 font-bold mb-2 bg-red-50 p-2 rounded-lg border border-red-200 leading-snug">
                  <p>⚠️ 시간 <strong>2400</strong> 입력 시 자동 익일 변환</p>
                  <p className="font-normal text-gray-500">(≡ 아이콘을 꾹 눌러 위아래로 끌어 순서 변경)</p>
                </div>
                <div className="space-y-1.5">
                  {timeline.map((t, idx) => (
                    <div key={t.id} data-index={idx} className={`flex items-center gap-1 bg-white p-1.5 rounded-lg border shadow-sm transition-all ${dragOverIdx === idx ? 'border-blue-500 bg-blue-50 scale-[1.01]' : 'border-gray-200'}`}>
                      <div 
                        className={`flex flex-col items-center justify-center px-1.5 cursor-grab shrink-0 touch-none transition-transform ${draggedIdx === idx ? 'text-blue-600 scale-125' : 'text-gray-400 hover:text-gray-600'}`}
                        draggable onDragStart={(e) => { setDraggedIdx(idx); e.dataTransfer.effectAllowed = 'move'; }} onDragEnter={() => setDragOverIdx(idx)} onDragOver={(e) => e.preventDefault()}
                        onDragEnd={() => { if (draggedIdx !== null && dragOverIdx !== null && draggedIdx !== dragOverIdx) { setTimeline(prev => { const newTimeline = [...prev]; const item = newTimeline.splice(draggedIdx, 1)[0]; newTimeline.splice(dragOverIdx, 0, item); return newTimeline; }); } setDraggedIdx(null); setDragOverIdx(null); }}
                        onDrop={() => { if (draggedIdx === null || dragOverIdx === null) return; if (draggedIdx !== dragOverIdx) { setTimeline(prev => { const newTimeline = [...prev]; const item = newTimeline.splice(draggedIdx, 1)[0]; newTimeline.splice(dragOverIdx, 0, item); return newTimeline; }); } setDraggedIdx(null); setDragOverIdx(null); }}
                        onTouchStart={() => { touchTimer.current = setTimeout(() => { isDraggingRef.current = true; setDraggedIdx(idx); if (navigator.vibrate) navigator.vibrate(50); }, 400); }}
                        onTouchMove={(e) => { if (!isDraggingRef.current) { if (touchTimer.current) clearTimeout(touchTimer.current); return; } const touch = e.touches[0]; const element = document.elementFromPoint(touch.clientX, touch.clientY); const indexStr = element?.closest('[data-index]')?.getAttribute('data-index'); if (indexStr) { setDragOverIdx(parseInt(indexStr, 10)); } }}
                        onTouchEnd={() => { if (touchTimer.current) clearTimeout(touchTimer.current); if (isDraggingRef.current && draggedIdx !== null && dragOverIdx !== null && draggedIdx !== draggedIdx) { setTimeline(prev => { const newTimeline = [...prev]; const item = newTimeline.splice(draggedIdx, 1)[0]; newTimeline.splice(dragOverIdx, 0, item); return newTimeline; }); } isDraggingRef.current = false; setDraggedIdx(null); setDragOverIdx(null); }}
                        onTouchCancel={() => { if (touchTimer.current) clearTimeout(touchTimer.current); isDraggingRef.current = false; setDraggedIdx(null); setDragOverIdx(null); }}
                      >
                        <span className="text-[16px] leading-none" title="이동">≡</span>
                      </div>
                      <input type="text" maxLength={4} placeholder="시간" value={t.time} onChange={(e) => handleTimelineChange(t.id, 'time', e.target.value)} className={`w-[46px] border p-1 rounded-lg text-center font-mono text-[13px] font-bold h-9 ${reportMode === 'FDR' ? 'bg-red-50 text-red-900' : 'bg-blue-50 text-blue-900'} placeholder-gray-400 outline-none shrink-0`} />
                      <label className="text-[10px] text-blue-600 font-bold flex items-center whitespace-nowrap cursor-pointer px-0.5 shrink-0"><input type="checkbox" checked={t.nextDay || false} onChange={e => handleTimelineChange(t.id, 'nextDay', e.target.checked)} className="w-3.5 h-3.5 mr-0.5" />+1</label>
                      <span className="text-gray-400 font-bold shrink-0">:</span>
                      <input type="text" value={t.content} placeholder="내용 입력" onChange={(e) => handleTimelineChange(t.id, 'content', e.target.value)} className="flex-1 min-w-[50px] border p-1 rounded-lg text-[13px] font-bold h-9 outline-none" />
                      <button type="button" onClick={() => insertTimelineItem(idx)} className="text-blue-500 font-extrabold px-1 text-lg leading-none cursor-pointer shrink-0" title="추가">+</button>
                      <button type="button" onClick={() => handleRemoveTimeline(t.id)} className="text-red-500 font-bold px-1 text-xl leading-none cursor-pointer shrink-0" title="삭제">&times;</button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-100 mt-3">
                  <button onClick={() => toggleSection(6)} className="text-[13px] bg-gray-200 text-gray-700 px-5 py-2.5 rounded-lg shadow-sm cursor-pointer font-bold">⬅️ 이전</button>
                  <button onClick={() => handleNextStep(7)} className="text-[13px] bg-slate-800 text-white px-5 py-2.5 rounded-lg shadow cursor-pointer font-bold">다음 단계 ➡️</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 8: 직원 H/D TIME (업무 시간) */}
        {maxUnlockedSection >= 8 && (
          <div id="section-8" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <button onClick={() => toggleSection(8)} className={`w-full flex justify-between items-center transition-colors ${activeSection === 8 ? 'p-3.5 bg-gray-50 hover:bg-gray-100' : 'py-2 px-3 bg-white hover:bg-gray-50'}`}>
              <span className={`transition-all ${activeSection === 8 ? 'font-extrabold text-[14px] text-slate-800' : 'font-bold text-[11px] text-gray-400'}`}>직원 H/D TIME (업무 시간)</span>
              {getBadge(8)}
            </button>
            {activeSection === 8 && (
              <div className="p-3 border-t border-gray-100 space-y-4">
                {renderErrorBox(8)}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[12px] font-bold text-gray-700 flex items-center">현장 게이트 지원 인원 <span className="font-medium text-[10px] text-gray-500 ml-1">(최소 1명)</span><InfoBtn code="HD_TIME" /></span>
                    <button type="button" onClick={handleAddHdStaff} className="text-[10px] bg-blue-600 text-white px-2.5 py-1.5 rounded-lg shadow cursor-pointer font-bold">+ 추가</button>
                  </div>
                  <p className="text-red-600 font-bold text-[10px] mb-2 bg-red-50 p-2 rounded-lg border border-red-100">※ 출국업무일지에 기재되는 실제 업무 시작/종료 시간과 일치해야 합니다.</p>
                  <div className="space-y-1.5">
                    {hdTimes.map(h => {
                      const durStr = calculateDuration(h.start, h.end, h.endNextDay);
                      return (
                        <div key={h.id} className="flex flex-col gap-1 border border-gray-200 p-1.5 rounded-xl bg-white shadow-sm">
                          <div className="flex gap-1 items-center">
                            <input type="text" placeholder={h.typeLabel} value={h.name} onChange={e => handleNameChange(h.id, e.target.value)} className="w-[74px] border p-1 rounded-lg text-center text-[12px] font-bold bg-blue-50 h-9 shrink-0" />
                            <input type="text" inputMode="numeric" maxLength={4} placeholder="시작" value={h.start} onChange={e => handleHdTimeChange(h.id, 'start', e.target.value)} className="flex-1 min-w-[50px] border p-1 rounded-lg text-center font-mono text-[13px] font-bold bg-blue-50 h-9 placeholder-gray-400" />
                            <span className="text-gray-400 text-[12px] shrink-0">~</span>
                            <input type="text" inputMode="numeric" maxLength={4} placeholder="종료" value={h.end} onChange={e => handleHdTimeChange(h.id, 'end', e.target.value)} className="flex-1 min-w-[50px] border p-1 rounded-lg text-center font-mono text-[13px] font-bold bg-blue-50 h-9 placeholder-gray-400" />
                            <label className="text-[10px] text-blue-600 font-bold flex items-center px-0.5 whitespace-nowrap cursor-pointer shrink-0"><input type="checkbox" checked={h.endNextDay} onChange={e => handleCheckboxChange(h.id, e.target.checked)} className="w-3.5 h-3.5 mr-0.5" />+1</label>
                            <button type="button" onClick={() => handleRemoveHdStaff(h.id)} className="text-red-500 font-bold px-1.5 text-lg leading-none cursor-pointer shrink-0">&times;</button>
                          </div>
                          {durStr && (<div className="text-[10px] text-blue-600 font-bold text-right pr-6 mt-0.5">H/D TIME {durStr}</div>)}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-100 mt-3">
                  <button onClick={() => toggleSection(7)} className="text-[13px] bg-gray-200 text-gray-700 px-5 py-2.5 rounded-lg shadow-sm cursor-pointer font-bold">⬅️ 이전</button>
                  <button onClick={() => handleNextStep(8)} className="text-[13px] bg-slate-800 text-white px-5 py-2.5 rounded-lg shadow cursor-pointer font-bold">다음 단계 ➡️</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 9: ADD MAN TIME (추가 인력) */}
        {maxUnlockedSection >= 9 && (
          <div id="section-9" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <button onClick={() => toggleSection(9)} className={`w-full flex justify-between items-center transition-colors ${activeSection === 9 ? 'p-3.5 bg-gray-50 hover:bg-gray-100' : 'py-2 px-3 bg-white hover:bg-gray-50'}`}>
              <span className={`transition-all ${activeSection === 9 ? 'font-extrabold text-[14px] text-slate-800' : 'font-bold text-[11px] text-gray-400'}`}>ADD MAN TIME (추가 인력)</span>
              {getBadge(9)}
            </button>
            {activeSection === 9 && (
              <div className="p-3 border-t border-gray-100 space-y-4">
                {renderErrorBox(9)}
                <div className="border border-blue-200 p-2.5 rounded-xl space-y-2 bg-blue-50/20">
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] font-bold text-blue-900 flex items-center">지원/오피스 인력<InfoBtn code="ADD_MAN" /></span>
                    <button type="button" onClick={handleAddManStaff} className="text-[10px] bg-blue-600 text-white px-2.5 py-1.5 rounded-lg shadow cursor-pointer font-bold">+ 추가</button>
                  </div>
                  
                  {isAddManAutoAdjusted && (
                    <div className="text-[11px] text-orange-700 font-bold bg-orange-100 p-2 rounded-lg border border-orange-300 mt-1">
                      🚨 [FDR 자동보정] ADD MAN 시작 시간이 STD 기준 1시간 이후로 안전하게 자동 보정되었습니다.
                    </div>
                  )}
                  {isEdiAutoAdjusted && (
                    <div className="text-[11px] text-orange-700 font-bold bg-orange-100 p-2 rounded-lg border border-orange-300 mt-1">
                      🚨 [EDI 자동보정] 오피스 직원의 지원 시간은 최대 1시간을 초과할 수 없어 시스템에서 자동 조정했습니다.
                    </div>
                  )}

                  {isEdiRequired() ? (
                    <p className="text-[10px] text-red-600 font-bold bg-red-50 p-1.5 rounded-lg border border-red-200">🚨 {reportMode === 'FDR' ? 'FDR은 EDI(오피스) 필수 입력입니다.' : '국제선 FERRY는 EDI(오피스) 필수 입력입니다.'}</p>
                  ) : (
                    <p className="text-[10px] text-gray-500 font-medium">※ EDI(오피스) 직원은 FDR/국제선 FERRY 시 필수입니다.</p>
                  )}
                  <p className="text-[10px] text-gray-500 font-medium leading-relaxed">※ 이름 란에 'EDI'나 '오피스'라고 적지 말고 <strong className="text-red-500">실제 근무한 직원 실명</strong>을 적어주세요.<br/>※ SPVR는 <strong className="text-blue-600">GATE MAIN 직원</strong>만 적용 됩니다.</p>
                  
                  <div className="space-y-1.5">
                    {addManList.map(s => {
                      const durStr = calculateDuration(s.start, s.end, s.endNextDay);
                      return (
                        <div key={s.id} className="flex flex-col gap-1 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
                          <div className="flex gap-1 items-center">
                            <select value={s.role} onChange={e => handleRoleChange(s.id, e.target.value)} className={`border p-1 rounded-lg text-[11px] font-bold w-[60px] h-9 bg-white cursor-pointer shrink-0 ${s.role === 'EDI' ? 'text-red-600' : 'text-blue-900'}`}>
                              <option value="SPVR" className="text-blue-900">SPVR</option><option value="AGNT" className="text-blue-900">AGNT</option><option value="EDI" className="text-red-600 font-bold">EDI</option>
                            </select>
                            <input type="text" placeholder="실명" value={s.name} onChange={e => handleNameChange(s.id, e.target.value)} className="w-[66px] border p-1 rounded-lg text-center text-[12px] font-bold h-9 shrink-0" />
                            <input type="text" inputMode="numeric" maxLength={4} placeholder="시작" value={s.start} onChange={e => handleAddManTimeChange(s.id, 'start', e.target.value)} className="flex-1 min-w-[50px] border p-1 rounded-lg text-center font-mono text-[13px] font-bold h-9 placeholder-gray-400" />
                            <span className="text-gray-400 text-[12px] shrink-0">~</span>
                            <input type="text" inputMode="numeric" maxLength={4} placeholder="종료" value={s.end} onChange={e => handleAddManTimeChange(s.id, 'end', e.target.value)} className="flex-1 min-w-[50px] border p-1 rounded-lg text-center font-mono text-[13px] font-bold h-9 placeholder-gray-400" />
                            <label className="text-[10px] text-blue-600 font-bold flex items-center px-0.5 whitespace-nowrap cursor-pointer shrink-0"><input type="checkbox" checked={s.endNextDay} onChange={e => handleCheckboxChange(s.id, e.target.checked)} className="w-3.5 h-3.5 mr-0.5" />+1</label>
                            <button type="button" onClick={() => handleRemoveManStaff(s.id)} className="text-red-500 font-bold px-1.5 text-lg leading-none cursor-pointer shrink-0">&times;</button>
                          </div>
                          {durStr && (<div className="text-[10px] text-blue-600 font-bold text-right pr-6 mt-0.5">ADD MAN TIME {durStr}</div>)}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="flex justify-between pt-3 border-t border-gray-100 mt-3">
                  <button onClick={() => toggleSection(8)} className="text-[13px] bg-gray-200 text-gray-700 px-5 py-2.5 rounded-lg shadow-sm cursor-pointer font-bold">⬅️ 이전</button>
                  <button onClick={() => handleNextStep(9)} className="text-[13px] bg-slate-800 text-white px-5 py-2.5 rounded-lg shadow cursor-pointer font-bold">다음 단계 ➡️</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 10: 작성자 정보 */}
        {maxUnlockedSection >= 10 && (
          <div id="section-10" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
            <button onClick={() => toggleSection(10)} className={`w-full flex justify-between items-center transition-colors ${activeSection === 10 ? 'p-3.5 bg-gray-50 hover:bg-gray-100' : 'py-2 px-3 bg-white hover:bg-gray-50'}`}>
              <span className={`transition-all ${activeSection === 10 ? 'font-extrabold text-[14px] text-slate-800' : 'font-bold text-[11px] text-gray-400'}`}>작성자 정보 (최종)</span>
              {getBadge(10)}
            </button>
            {activeSection === 10 && (
              <div className="p-3 border-t border-gray-100 space-y-3">
                {renderErrorBox(10)}
                <div>
                  <input type="text" placeholder="LAST NAME(성) FIRST NAME(이름)" value={writerName} onChange={e => setWriterName(e.target.value)} className={`w-full border p-3 rounded-lg text-[14px] uppercase font-bold bg-white ${hasKoreanName ? 'border-red-400 bg-red-50' : ''}`} />
                  {hasKoreanName && (<span className="text-[10px] text-red-600 font-bold block mt-1">※ 가급적 영문 입력을 권장합니다.</span>)}
                </div>
                <div>
                  <input type="text" inputMode="numeric" maxLength={13} placeholder="전화번호 (숫자만 입력)" value={writerPhone} onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ''); let formatted = val; if (val.length > 3 && val.length <= 7) formatted = `${val.slice(0, 3)}-${val.slice(3)}`; else if (val.length > 7) formatted = `${val.slice(0, 3)}-${val.slice(3, 7)}-${val.slice(7, 11)}`; setWriterPhone(formatted); }} className="w-full border p-3 rounded-lg text-[14px] font-bold" />
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-100 mt-3">
                  <button onClick={() => toggleSection(9)} className="text-[13px] bg-gray-200 text-gray-700 px-5 py-2.5 rounded-lg shadow-sm cursor-pointer font-bold">⬅️ 이전</button>
                  <button onClick={handleOpenPreview} className="text-[13px] bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow cursor-pointer font-bold">최종 확인 📋</button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col items-center gap-1.5 mt-4 py-2">
          <div className="text-center text-[10px] text-gray-400 font-mono">CREATED BY SH.CHO (Ver 2.0)</div>
          <button type="button" onClick={() => window.open('mailto:shcho1219@airkorea.biz?subject=[스마트 리포트 툴] 오류 제보 및 건의사항')} className="text-[10px] text-gray-500 underline hover:text-gray-700 cursor-pointer">💡 시스템 오류 제보 및 건의사항 남기기</button>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] max-w-md mx-auto flex gap-2">
        <button type="button" onClick={() => saveToLocalStorage(true)} className="w-1/3 bg-gray-500 text-white py-3.5 rounded-xl font-bold text-[13px] shadow-sm active:bg-gray-400 transition cursor-pointer flex justify-center items-center gap-1"><span>💾 임시저장</span></button>
        <button type="button" onClick={handleOpenPreview} className="w-2/3 bg-slate-900 text-white py-3.5 rounded-xl font-bold text-[13px] shadow-sm active:bg-slate-700 transition cursor-pointer">메일 양식 확인 및 복사하기 📋</button>
      </footer>

      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="bg-slate-900 text-white p-3 flex justify-between items-center">
              <span className="font-bold text-[13px]">📩 메일 본문 복사하기</span>
              <button type="button" onClick={() => setShowPreviewModal(false)} className="text-2xl leading-none cursor-pointer">&times;</button>
            </div>
            <div className="bg-red-600 text-white p-4 text-[16px] font-extrabold leading-snug flex flex-col gap-2">
              <span>⚠️ [직원 필독 사고 방지]</span>
              <span className="text-[14px] font-medium leading-relaxed">아래 내용(수신처 포함)을 전체 복사하여 메일 본문에 붙여넣은 뒤, <b>수신처/제목 부분만 메일 설정에 맞게 잘라내기</b> 하세요!</span>
            </div>
            {missingFields.length > 0 && (
              <div className="p-3 bg-red-50 border-b border-red-200">
                <span className="text-red-700 font-bold text-[11px] block mb-1.5">🚨 확인 필요한 누락 항목:</span>
                <div className="flex flex-wrap gap-1">
                  {missingFields.map(f => (<span key={f} className="bg-red-100 text-red-800 text-[10px] px-2 py-1 rounded font-semibold border border-red-200">{f.replace('[오류] ', '')}</span>))}
                </div>
              </div>
            )}
            <div className="p-3 overflow-y-auto flex-1 bg-gray-50 text-[12px]">
              <pre className="whitespace-pre-wrap font-mono text-slate-800 bg-white p-3 rounded-lg border leading-relaxed select-all">
                {previewText.split(/(LJ---|RS---|BX---|----L|시간L|이름입력필요|번호입력필요|미입력|XXX|---)/g).map((part, i) => {
                  if (['LJ---', 'RS---', 'BX---', '----L', '시간L', '이름입력필요', '번호입력필요', '미입력', 'XXX', '---'].includes(part)) {
                    return <span key={i} className="text-red-600 font-extrabold bg-red-50 rounded px-1 py-0.5">{part}</span>;
                  }
                  return part;
                })}
              </pre>
            </div>
            <div className="p-3 border-t bg-white flex flex-col gap-2">
              <button type="button" onClick={() => setShowPreviewModal(false)} className="w-full py-3.5 rounded-xl font-bold bg-slate-800 text-white text-[14px] shadow-sm active:scale-95 transition cursor-pointer flex justify-center items-center gap-2"><span>⬅️ 계속 수정하기 (돌아가기)</span></button>
              <button type="button" onClick={(e) => { if (missingFields.length > 0) { const proceed = window.confirm("🚨 오류/누락된 항목이 있습니다.\n\n그래도 이대로 복사하시겠습니까?"); if (!proceed) return; } handleFinalCopy(); }} className={`w-full py-3.5 rounded-xl font-bold text-[14px] shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer ${missingFields.length > 0 ? "bg-orange-500 text-white active:scale-95" : "bg-blue-600 text-white active:scale-95"}`}>
                <span>✨ [전체 내용] {missingFields.length > 0 ? '강제 복사하기' : '안전하게 복사하기'} 📋</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}