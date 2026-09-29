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

const getTimelineObjects = (arr: string[]): TimelineItem[] => 
  arr.map((c, i) => ({ id: Date.now() + Math.random(), time: '', content: c, nextDay: false }));

const acTypeOptions: Record<string, { label: string; cfg: string }[]> = {
  LJ: [
    { label: 'B738', cfg: '189' },
    { label: 'B739', cfg: '188' },
    { label: 'B738M', cfg: '189' },
    { label: 'B772', cfg: '393' },
    { label: 'A321-200 (174)', cfg: '174' },
    { label: 'A321-200', cfg: '220' },
    { label: 'A321-195', cfg: '195' },
    { label: 'A321neo', cfg: '232' }
  ],
  RS: [
    { label: 'A321-200', cfg: '220' }, 
    { label: 'A321-195', cfg: '195' }
  ],
  BX: [
    { label: 'A320-200', cfg: '180' },
    { label: 'A321-200', cfg: '220' }, 
    { label: 'A321-195', cfg: '195' }, 
    { label: 'A321neo', cfg: '232' },
    { label: 'A321neo (220)', cfg: '220' }
  ]
};

const FLEET_DB: Record<string, { airline: string; type: string; cfg: string }> = {
  /* ✈️ 진에어 (JIN AIR) */
  '8004': { airline: 'LJ', type: 'A321-200 (174)', cfg: '174' },
  '8009': { airline: 'LJ', type: 'A321-200 (174)', cfg: '174' }, 
  '8775': { airline: 'LJ', type: 'A321neo', cfg: '232' }, 
  '8776': { airline: 'LJ', type: 'A321neo', cfg: '232' }, 
  '8778': { airline: 'LJ', type: 'A321neo', cfg: '232' }, 
  '7560': { airline: 'LJ', type: 'B738', cfg: '189' },
  '7561': { airline: 'LJ', type: 'B738', cfg: '189' },
  '7562': { airline: 'LJ', type: 'B738', cfg: '189' },
  '7757': { airline: 'LJ', type: 'B738', cfg: '189' },
  '7786': { airline: 'LJ', type: 'B738', cfg: '189' },
  '8012': { airline: 'LJ', type: 'B738', cfg: '189' },
  '8013': { airline: 'LJ', type: 'B738', cfg: '189' },
  '8014': { airline: 'LJ', type: 'B738', cfg: '189' },
  '8015': { airline: 'LJ', type: 'B738', cfg: '189' },
  '8016': { airline: 'LJ', type: 'B738', cfg: '189' },
  '8017': { airline: 'LJ', type: 'B738', cfg: '189' },
  '8224': { airline: 'LJ', type: 'B738', cfg: '189' },
  '8225': { airline: 'LJ', type: 'B738', cfg: '189' },
  '8242': { airline: 'LJ', type: 'B738', cfg: '189' },
  '8243': { airline: 'LJ', type: 'B738', cfg: '189' },
  '8244': { airline: 'LJ', type: 'B738', cfg: '189' },
  '8245': { airline: 'LJ', type: 'B738', cfg: '189' },
  '8246': { airline: 'LJ', type: 'B738', cfg: '189' },
  '8247': { airline: 'LJ', type: 'B738', cfg: '189' },
  '7718': { airline: 'LJ', type: 'B739', cfg: '188' },
  '7719': { airline: 'LJ', type: 'B739', cfg: '188' },
  '7724': { airline: 'LJ', type: 'B739', cfg: '188' },
  '7215': { airline: 'LJ', type: 'B738M', cfg: '189' },
  '7216': { airline: 'LJ', type: 'B738M', cfg: '189' },
  '7217': { airline: 'LJ', type: 'B738M', cfg: '189' },
  '7218': { airline: 'LJ', type: 'B738M', cfg: '189' },
  '8353': { airline: 'LJ', type: 'B738M', cfg: '189' },
  '8568': { airline: 'LJ', type: 'B738M', cfg: '189' },
  '8569': { airline: 'LJ', type: 'B738M', cfg: '189' },
  '7734': { airline: 'LJ', type: 'B772', cfg: '393' },
  '7743': { airline: 'LJ', type: 'B772', cfg: '393' },
  '7750': { airline: 'LJ', type: 'B772', cfg: '393' },

  /* ✈️ 에어부산 (AIR BUSAN) */
  '7744': { airline: 'BX', type: 'A320-200', cfg: '180' },
  '7753': { airline: 'BX', type: 'A320-200', cfg: '180' },
  '8055': { airline: 'BX', type: 'A320-200', cfg: '180' },
  '8309': { airline: 'BX', type: 'A320-200', cfg: '180' },
  '8328': { airline: 'BX', type: 'A320-200', cfg: '180' },
  '7210': { airline: 'BX', type: 'A321-200', cfg: '220' },
  '7211': { airline: 'BX', type: 'A321-200', cfg: '220' },
  '7729': { airline: 'BX', type: 'A321-195', cfg: '195' },
  '7730': { airline: 'BX', type: 'A321-195', cfg: '195' },
  '8099': { airline: 'BX', type: 'A321-200', cfg: '220' },
  '8256': { airline: 'BX', type: 'A321-195', cfg: '195' },
  '8257': { airline: 'BX', type: 'A321-195', cfg: '195' },
  '8365': { airline: 'BX', type: 'A321-200', cfg: '220' },
  '8357': { airline: 'BX', type: 'A321neo', cfg: '232' },
  '8366': { airline: 'BX', type: 'A321neo (220)', cfg: '220' },
  '8394': { airline: 'BX', type: 'A321neo (220)', cfg: '220' },
  '8395': { airline: 'BX', type: 'A321neo', cfg: '232' },
  '8396': { airline: 'BX', type: 'A321neo', cfg: '232' },
  '8504': { airline: 'BX', type: 'A321neo', cfg: '232' },
  '8525': { airline: 'BX', type: 'A321neo', cfg: '232' },
  '8526': { airline: 'BX', type: 'A321neo', cfg: '232' },

  /* ✈️ 에어서울 (AIR SEOUL) */
  '7212': { airline: 'RS', type: 'A321-200', cfg: '220' },
  '7789': { airline: 'RS', type: 'A321-195', cfg: '195' },
  '7790': { airline: 'RS', type: 'A321-195', cfg: '195' },
  '8072': { airline: 'RS', type: 'A321-200', cfg: '220' },
  '8073': { airline: 'RS', type: 'A321-200', cfg: '220' },
  '8255': { airline: 'RS', type: 'A321-195', cfg: '195' },
};

const FIELD_TOOLTIPS: Record<string, { title: string; desc: string }> = {
  CFG: { title: 'CONFIG (가용 좌석 수)', desc: '해당 항공기 기종의 전체 판매/장착 가능한 총 좌석 수입니다. 예외 시 수동 수정이 가능합니다.' },
  BKG: { title: 'BOOKING (예약 승객 수)', desc: '최종 예약 인원수입니다.' },
  OBD: { title: 'ON BOARD (탑승 승객 수)', desc: '실제 탑승한 총 승객 수입니다. (유아 INF 제외)' },
  INF: { title: 'INFANT (유아 수)', desc: '좌석을 점유하지 않는 만 2세 미만 유아 승객 수입니다.' },
  STD: { title: 'STD / STA (표준 스케줄 시간)', desc: '항공권 판매 및 스케줄 상의 원래 출발/도착 예정 시각입니다. (4자리 HHMM)' },
  ETD: { title: 'ETD / ETA (변경 예상 시간)', desc: '지연 등으로 변경 예상되는 출발/도착 예정 시각입니다.' },
  ATD: { title: 'ATD / ATA (실제 운항 시간)', desc: '실제 이륙(Off-Block/Airborne) 또는 착륙/주기(Block-in) 시간입니다.' },
  REG: { title: 'REG No. (등록 기호)', desc: '항공기 꼬리날개 고유 등록 번호 4자리 숫자를 입력합니다. (입력 시 A/C TYPE 자동 세팅)' },
  SPOT: { title: 'SPOT (주기장 번호)', desc: '인천공항 주기장/게이트 번호입니다.' },
  HD_TIME: { title: 'H/D TIME (직원 투입 시간)', desc: '담당 직원이 실제 게이트/현장에서 업무를 시작하고 종료한 시간입니다. (출국일지와 일치 필수)' },
  ADD_MAN: { title: 'ADD MAN TIME (추가 인력 지원)', desc: '지원 인력 및 오피스(EDI) 직원의 투입 시간입니다. FDR 및 FHR FERRY 시 EDI 필수' },
  DLA_NOTICE: { title: 'DLA SET NOTICE (지연 통보)', desc: '운항통제나 ICNKK로부터 공식 지연 확정 안내를 통보받은 시각과 출처입니다.' },
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

  const triggerTimeAlert = (msg: string) => {
    setTimeAlertMsg(msg);
    if (timeAlertTimeout.current) clearTimeout(timeAlertTimeout.current);
    timeAlertTimeout.current = setTimeout(() => {
      setTimeAlertMsg('');
    }, 4000);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const names = localStorage.getItem('airkorea_recent_names');
      if (names) {
        setSavedNames(JSON.parse(names));
      }
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
    if (regNo.length === 4) {
      const fleetInfo = FLEET_DB[regNo];
      if (fleetInfo) {
        if (fleetInfo.airline !== airline) {
          const isCrossOp = window.confirm(
            `⚠️ [소속 불일치 경고]\n\n입력하신 HL${regNo} 기재는 ${getAirlineLabel(fleetInfo.airline)}(${fleetInfo.airline}) 소속 항공기입니다.\n\n현재 선택된 편명은 ${airline}입니다. 타사 기재가 교차 투입된 것이 맞습니까?\n\n(단순 오타인 경우 [취소]를 눌러 다시 입력해주세요.)`
          );
          if (!isCrossOp) {
            setRegNo('');
            setAcTypeSelect('');
            setAcTypeCustom('');
            setCfg('');
            return;
          }
        }

        const existsInDropdown = acTypeOptions[airline].some(opt => opt.label === fleetInfo.type);
        if (existsInDropdown) {
          setAcTypeSelect(fleetInfo.type);
        } else {
          setAcTypeSelect('CUSTOM');
          setAcTypeCustom(fleetInfo.type);
        }
        setCfg(fleetInfo.cfg); 
        triggerTimeAlert(`✅ HL${regNo} 기재 정보(${fleetInfo.type} / ${fleetInfo.cfg}석) 자동 세팅 완료`);
      } else {
        setAcTypeSelect('');
        setAcTypeCustom('');
        setCfg('');
      }
    } else if (regNo.length < 4) {
      setAcTypeSelect('');
      setAcTypeCustom('');
      setCfg('');
    }
  }, [regNo, airline]);

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
  const [fhrRzn, setFhrRzn] = useState('NIL');
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

  const resetStaffList = (mode: string, type: string) => {
    const shortTypes = ['FERRY OUT', 'FERRY IN', '자발적 하기', '비자발적 하기', 'DIVERT', 'BUS HNDL'];
    if (mode === 'FHR' && shortTypes.includes(type)) {
      setHdTimes([
        { id: 1, typeLabel: 'AGT1', name: '', start: '', end: '', endNextDay: false },
        { id: 2, typeLabel: 'AGT2', name: '', start: '', end: '', endNextDay: false },
      ]);
      setAddManList([
        { id: 1, role: 'AGNT', detailLabel: 'AGT1', name: '', start: '', end: '', endNextDay: false },
        { id: 2, role: 'AGNT', detailLabel: 'AGT2', name: '', start: '', end: '', endNextDay: false },
        { id: 3, role: 'EDI', detailLabel: 'EDI', name: '', start: '', end: '', endNextDay: false }
      ]);
    } else {
      setHdTimes([
        { id: 1, typeLabel: '1차 직원', name: '', start: '', end: '', endNextDay: false },
        { id: 2, typeLabel: '메인', name: '', start: '', end: '', endNextDay: false },
        { id: 3, typeLabel: 'AGT1', name: '', start: '', end: '', endNextDay: false },
        { id: 4, typeLabel: 'AGT2', name: '', start: '', end: '', endNextDay: false },
      ]);
      setAddManList([
        { id: 1, role: 'AGNT', detailLabel: '1차 직원', name: '', start: '', end: '', endNextDay: false },
        { id: 2, role: 'SPVR', detailLabel: '메인', name: '', start: '', end: '', endNextDay: false },
        { id: 3, role: 'AGNT', detailLabel: 'AGT1', name: '', start: '', end: '', endNextDay: false },
        { id: 4, role: 'AGNT', detailLabel: 'AGT2', name: '', start: '', end: '', endNextDay: false },
        { id: 5, role: 'EDI', detailLabel: 'EDI', name: '', start: '', end: '', endNextDay: false }
      ]);
    }
  };

  const clearFormFields = () => {
    setFlightNum('');
    setDate(getTodayKST());
    setOriginType('ICN');
    setOriginCustom('');
    setDestType('CUSTOM');
    setDestCustom('');
    setAcTypeSelect('');
    setAcTypeCustom('');
    setRegNo('');
    setSpot('');
    setStd('');
    setEtd('');
    setEtdNextDay(false);
    setAtd('');
    setAtdNextDay(false);
    setCfg('');
    setBkg('');
    setObd('');
    setInf('');
    setDlaPreset('항공기 연결 관계로 인한 출발 지연');
    setDlaSummary('항공기 연결 관계로 인한 출발 지연');
    setDlaNoticeSource('NIL');
    setDlaNoticeTime('');
    setDlaReason('항공기 연결 관계로 인한 출발 지연');
    setFhrType('FERRY OUT');
    setFhrSubjectSummary('FERRY OUT - 국제선');
    setFhrPaxNm('');
    setFhrPaxCount('1');
    setFerryType('국제선');
    setFhrRzn('NIL');
    setFhrActn('위 사유로 승객 인터뷰 진행 및 상태 확인하였으며, 구급대 지원 요청없이 하기 진행\n하기 완료 후 OFLD 업무 절차에 따라 역사열 진행');
    setTimeline(getTimelineObjects(getFdrDefaultTimeline(airline)));
    setOthrSpcl('');
    resetStaffList(reportMode, 'FERRY OUT');
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

  const isDefaultRzn = (rzn: string) => {
    return [
      '건강 상 사유에 따른 승객 요청으로 1 PAX OFLD',
      '회사 규정에 따른 비자발적 하기 조치 진행',
      'NIL',
      '정비로 인한 RAMP RETURN',
      'GMP CURFEW로 인한 ICN DIVRT',
      '기상악화로 인한 결항',
      '연결편 항공기 지연 도착으로 인한 BUS HNDL',
      ''
    ].includes(rzn.trim()) || rzn.includes('기재 중정비를 위한 FERRY 운항');
  };

  const isDefaultActn = (actn: string) => {
    return [
      '위 사유로 승객 인터뷰 진행 및 상태 확인하였으며, 구급대 지원 요청없이 하기 진행\n하기 완료 후 OFLD 업무 절차에 따라 역사열 진행',
      '입국장 교통편 안내',
      '',
      'NIL'
    ].includes(actn.trim());
  };

  const isDefaultSpcl = (spcl: string) => {
    return ['', 'NIL', 'HOT CLM 승객 발생', 'COMPLAIN : NIL'].includes(spcl.trim());
  };

  useEffect(() => {
    if (reportMode === 'FHR' && (fhrType === 'FERRY OUT' || fhrType === 'FERRY IN')) {
      setFhrSubjectSummary(`${fhrType} - ${ferryType}`);
      
      if (ferryType === '국제선(중정비)') {
        const rNo = (regNo && regNo.length > 0) ? regNo : '0000';
        if (isDefaultRzn(fhrRzn)) setFhrRzn(`HL${rNo} 기재 중정비를 위한 FERRY 운항`);
      } else {
        if (isDefaultRzn(fhrRzn)) setFhrRzn('NIL');
      }
    }
  }, [reportMode, fhrType, ferryType, regNo]);

  useEffect(() => {
    if (step === 'myRecords') {
      const saved = localStorage.getItem('airkorea_report_history');
      if (saved) {
        setLocalRecords(JSON.parse(saved));
      }
    }
  }, [step]);

  const fetchLogsFromSheet = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch('/api/log');
      const json = await res.json();
      if (json.success && json.data && json.data.length > 1) {
        const rows = json.data.slice(1).reverse();
        setSheetLogs(rows);
      } else {
        setSheetLogs([]);
      }
    } catch (err) {
      console.error('로그 불러오기 실패:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const toMinutes = (hhmm: string) => {
    if (!hhmm || hhmm.length !== 4) return 0;
    return parseInt(hhmm.slice(0, 2), 10) * 60 + parseInt(hhmm.slice(2, 4), 10);
  };
  const toHHMM = (min: number) => {
    return `${String(Math.floor(min / 60) % 24).padStart(2, '0')}${String(min % 60).padStart(2, '0')}`;
  };

  const calculateDuration = (start: string, end: string, isNextDay: boolean) => {
    if (start.length !== 4 || end.length !== 4) return null;
    let sMin = toMinutes(start);
    let eMin = toMinutes(end) + (isNextDay ? 1440 : 0);
    if (eMin < sMin - 300 && !isNextDay) eMin += 1440;
    const diff = Math.max(0, eMin - sMin);
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${String(h).padStart(2, '0')}HR ${String(m).padStart(2, '0')}MINS`;
  };

  const getDlaTimeStr = () => calculateDuration(std, atd, atdNextDay);

  const getFormattedObd = () => {
    if (isFerry) return '0';
    if (!obd) return '';
    if (inf && inf.trim() !== '' && inf.trim() !== '0') {
      const obdNum = parseInt(obd, 10) || 0;
      const infNum = parseInt(inf, 10) || 0;
      return `TTL ${obdNum + infNum} (OBD ${obdNum}, INF ${infNum})`;
    }
    return obd;
  };

  const saveToLocalStorage = (isDraft = false) => {
    if (writerName.trim()) localStorage.setItem('airkorea_writer_name', writerName.trim());
    if (writerPhone.trim()) localStorage.setItem('airkorea_writer_phone', writerPhone.trim());

    const currentState = {
      airline, reportMode, flightNum, date, originType, originCustom, destType, destCustom,
      acTypeSelect, acTypeCustom, regNo, spot, std, etd, etdNextDay, atd, atdNextDay,
      cfg, bkg, obd, inf, dlaPreset, dlaSummary, dlaNoticeSource, dlaNoticeTime, dlaReason,
      fhrType, fhrSubjectSummary, fhrPaxNm, fhrPaxCount, ferryType, fhrRzn, fhrActn,
      timeline, othrSpcl, hdTimes, addManList, introWriterName, writerName, writerPhone
    };

    const titlePrefix = isDraft ? '⚠️ [임시저장]' : `[${reportMode}]`;
    const fNumDisplay = flightNum ? flightNum : '미상';

    const record = {
      id: Date.now(),
      timestamp: new Date().toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      summaryTitle: `${titlePrefix} ${airline}${fNumDisplay} (${date})`,
      detail: reportMode === 'FDR' ? dlaSummary : fhrType,
      state: currentState
    };

    const existing = JSON.parse(localStorage.getItem('airkorea_report_history') || '[]');
    const updated = [record, ...existing].slice(0, 30);
    localStorage.setItem('airkorea_report_history', JSON.stringify(updated));

    if (isDraft) {
      alert('✅ 작성 중인 내용이 내 기기에 안전하게 임시저장되었습니다.\n(첫 화면의 [저장된 기록 불러오기]에서 확인 가능합니다.)');
    }
  };

  const handleLoadRecord = (stateToLoad: any) => {
    setAirline(stateToLoad.airline || 'LJ');
    setReportMode(stateToLoad.reportMode || 'FDR');
    setFlightNum(stateToLoad.flightNum || '');
    setDate(stateToLoad.date || getTodayKST());
    setOriginType(stateToLoad.originType || 'ICN');
    setOriginCustom(stateToLoad.originCustom || '');
    setDestType(stateToLoad.destType || 'CUSTOM');
    setDestCustom(stateToLoad.destCustom || '');
    setAcTypeSelect(stateToLoad.acTypeSelect || '');
    setAcTypeCustom(stateToLoad.acTypeCustom || '');
    setRegNo(stateToLoad.regNo || '');
    setSpot(stateToLoad.spot || '');
    setStd(stateToLoad.std || '');
    setEtd(stateToLoad.etd || '');
    setEtdNextDay(stateToLoad.etdNextDay || false);
    setAtd(stateToLoad.atd || '');
    setAtdNextDay(stateToLoad.atdNextDay || false);
    setCfg(stateToLoad.cfg || '');
    setBkg(stateToLoad.bkg || '');
    setObd(stateToLoad.obd || '');
    setInf(stateToLoad.inf || '');
    setDlaPreset(stateToLoad.dlaPreset || '직접 입력');
    setDlaSummary(stateToLoad.dlaSummary || '');
    setDlaNoticeSource(stateToLoad.dlaNoticeSource || 'NIL');
    setDlaNoticeTime(stateToLoad.dlaNoticeTime || '');
    setDlaReason(stateToLoad.dlaReason || '');
    setFhrType(stateToLoad.fhrType || 'FERRY OUT');
    setFhrSubjectSummary(stateToLoad.fhrSubjectSummary || '');
    setFhrPaxNm(stateToLoad.fhrPaxNm || '');
    setFhrPaxCount(stateToLoad.fhrPaxCount || '1');
    setFerryType(stateToLoad.ferryType || '국제선');
    setFhrRzn(stateToLoad.fhrRzn || '');
    setFhrActn(stateToLoad.fhrActn || '');
    setTimeline(stateToLoad.timeline || []);
    setOthrSpcl(stateToLoad.othrSpcl || '');
    setHdTimes(stateToLoad.hdTimes || []);
    setAddManList(stateToLoad.addManList || []);
    setIntroWriterName(stateToLoad.introWriterName || '');
    setWriterName(stateToLoad.writerName || '');
    setWriterPhone(stateToLoad.writerPhone || '');

    setStep('main');
  };

  const deleteLocalRecord = (id: number) => {
    if(confirm('이 기록을 기기에서 삭제하시겠습니까?')) {
      const existing = JSON.parse(localStorage.getItem('airkorea_report_history') || '[]');
      const updated = existing.filter((r: any) => r.id !== id);
      localStorage.setItem('airkorea_report_history', JSON.stringify(updated));
      setLocalRecords(updated);
    }
  };

  const sendIntroLogToGoogleSheet = async (writerName: string, mode: string, al: string) => {
    try {
      await fetch('/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: writerName.trim() || '미입력',
          mode: mode,
          flightNum: `[작성 진입]`, 
          date: getTodayKST(),
          route: `---`,
          acType: `---`,
          regNo: `---`,
          spot: `---`,
          paxStatus: `--- / --- / ---`,
          dlaSummary: `🟢 [시스템 접속 및 작성 시작]`,
          phone: `---`,
          reportText: '작성 시작 단계의 접속 로그입니다.',
        }),
      });
    } catch (error) {
      console.error('진입 로그 저장 에러:', error);
    }
  };

  const sendLogToGoogleSheet = async (finalReportText: string) => {
    try {
      let finalSummary = reportMode === 'FDR' ? dlaSummary : fhrType;
      
      if (missingFields && missingFields.length > 0) {
        finalSummary = `🚨 [강제복사] ${finalSummary} (누락: ${missingFields.join(', ')})`;
      }

      await fetch('/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: introWriterName.trim() || writerName.trim() || '미입력',
          mode: reportMode,
          flightNum: flightNum ? `${airline}${flightNum.toUpperCase()}` : '미입력',
          date: date || '미입력',
          route: `${getOriginCode()}-${getDestCode()}`,
          acType: getFinalAcType() || '미입력',
          regNo: regNo ? `HL${regNo}` : '미입력',
          spot: spot || '미입력',
          paxStatus: `${cfg || '-'} / ${isFerry ? '0' : bkg || '-'} / ${getFormattedObd() || '-'}`,
          dlaSummary: finalSummary,
          phone: writerPhone || '미입력',
          reportText: finalReportText,
        }),
      });
    } catch (error) {
      console.error('구글 시트 저장 에러:', error);
    }
  };

  const handleAirlineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newAl = e.target.value as 'LJ' | 'RS' | 'BX';
    setAirline(newAl);
    setAcTypeSelect('');
    setAcTypeCustom('');
    setCfg('');
    setDlaNoticeSource('NIL');
    if (reportMode === 'FDR') {
      setTimeline(getTimelineObjects(getFdrDefaultTimeline(newAl)));
    }
  };

  const handleReportModeChange = (mode: 'FDR' | 'FHR') => {
    setReportMode(mode);
    if (mode === 'FDR') {
      setTimeline(getTimelineObjects(getFdrDefaultTimeline(airline)));
      resetStaffList('FDR', '');
    } else {
      setFhrType('FERRY OUT');
      setFerryType('국제선');
      setFhrSubjectSummary('FERRY OUT - 국제선');
      setFhrRzn('NIL');
      setTimeline(getTimelineObjects(fhrTimelinesMap['FERRY OUT']));
      setOthrSpcl('NIL');
      resetStaffList('FHR', 'FERRY OUT');
    }
  };

  const isEdiRequired = () => {
    if (reportMode === 'FDR') {
      return true;
    }
    if (reportMode === 'FHR') {
      if (fhrType === 'FERRY OUT' || fhrType === 'FERRY IN') {
        return ferryType === '국제선' || ferryType === '국제선(중정비)';
      }
      return false;
    }
    return false;
  };

  const handleAcTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setAcTypeSelect(val);
    if (val === 'CUSTOM' || val === '') {
      setCfg('');
    } else {
      const found = acTypeOptions[airline].find(item => item.label === val);
      if (found) setCfg(found.cfg);
    }
  };

  const processTimeValue = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '').slice(0, 4);
    if (clean.length === 4) {
      let h = parseInt(clean.slice(0, 2), 10);
      let m = parseInt(clean.slice(2, 4), 10);
      if (m > 59) m = 59;
      let autoNextDay = false;
      let forceUncheck = false;

      if (h >= 24) {
        h = h % 24; 
        autoNextDay = true;
      } else if (h >= 0 && h <= 5) {
        autoNextDay = true;
      } else {
        forceUncheck = true; 
      }
      return { time: `${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}`, autoNextDay, forceUncheck };
    }
    return { time: clean, autoNextDay: false, forceUncheck: false };
  };

  const handleFlightTimeInput = (val: string, setTime: (t: string) => void, setNextDay?: (b: boolean) => void) => {
    const { time, autoNextDay, forceUncheck } = processTimeValue(val);
    setTime(time);
    if (setNextDay) {
      if (autoNextDay) setNextDay(true);
      else if (forceUncheck) setNextDay(false);
    }
  };

  const handleTimelineChange = (id: number, field: 'time' | 'content' | 'nextDay', val: any) => {
    setTimeline(prev => prev.map(t => {
      if (t.id === id) {
        if (field === 'time') {
          const { time, autoNextDay, forceUncheck } = processTimeValue(val);
          let isNextDay = t.nextDay;
          if (autoNextDay) isNextDay = true;
          else if (forceUncheck) isNextDay = false;
          return { ...t, time, nextDay: isNextDay };
        }
        return { ...t, [field]: val };
      }
      return t;
    }));
  };

  const insertTimelineItem = (index: number) => {
    const newTimeline = [...timeline];
    newTimeline.splice(index + 1, 0, { id: Date.now() + Math.random(), time: '', content: '', nextDay: false });
    setTimeline(newTimeline);
  };

  const handleAddTimeline = () => setTimeline([...timeline, { id: Date.now() + Math.random(), time: '', content: '', nextDay: false }]);
  const handleRemoveTimeline = (id: number) => setTimeline(timeline.filter(t => t.id !== id));

  const handleNameChange = (id: number, val: string) => {
    const cleanVal = val.trim().toUpperCase();
    if (['EDI', 'OFC', '오피스', 'OFFICE'].includes(cleanVal)) {
      triggerTimeAlert('🚨 해당 란에는 부서명이 아닌 [실제 투입된 직원 이름]을 적어 주세요!');
      val = ''; 
    }
    
    setHdTimes(prev => prev.map(item => item.id === id ? { ...item, name: val } : item));
    setAddManList(prev => prev.map(item => item.id === id ? { ...item, name: val } : item));
  };

  const handleRoleChange = (id: number, val: string) => {
    setAddManList(prev => prev.map(item => item.id === id ? { ...item, role: val } : item));
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
          if (reportMode === 'FDR' && addManStart.length === 4 && std.length === 4) {
            const stdMin = toMinutes(std);
            const inputMin = toMinutes(addManStart);
            if (inputMin < stdMin + 60) {
              addManStart = toHHMM((stdMin + 60) % 1440);
              triggerTimeAlert(`🚨 [ADD MAN] 시작 시간은 STD 기준 최소 1시간 이후로 자동 보정됩니다.`);
            }
          }
          if (reportMode === 'FDR' && addManStart.length === 4 && atd.length === 4) {
            const atdMin = toMinutes(atd) + (atdNextDay ? 1440 : 0);
            if (toMinutes(addManStart) > atdMin) addManStart = atd;
          }
          updated.start = addManStart;
        }

        if (field === 'end') {
          let addManEnd = processedVal;
          let addManEndNextDay = updated.endNextDay;
          if (autoNextDay) addManEndNextDay = true;
          else if (forceUncheck) addManEndNextDay = false;

          if (reportMode === 'FDR' && addManEnd.length === 4 && atd.length === 4) {
            const inputMin = toMinutes(addManEnd) + (addManEndNextDay ? 1440 : 0);
            const atdMin = toMinutes(atd) + (atdNextDay ? 1440 : 0);
            if (inputMin > atdMin) {
              addManEnd = atd;
              addManEndNextDay = atdNextDay;
              triggerTimeAlert(`🚨 [ADD MAN] 종료 시간이 ATA(${atd})를 초과하여 자동 보정되었습니다.`);
            }
          }
          updated.end = addManEnd;
          updated.endNextDay = addManEndNextDay;
          
          if (updated.role === 'EDI' && updated.start.length === 4 && addManEnd.length === 4) {
             let sMin = toMinutes(updated.start);
             let eMin = toMinutes(addManEnd) + (addManEndNextDay ? 1440 : 0);
             if (eMin < sMin) eMin += 1440;
             if (eMin - sMin > 60) {
               updated.start = toHHMM((eMin - 60) % 1440);
               triggerTimeAlert('🚨 EDI 직원의 ADD MAN은 최대 1시간을 초과할 수 없어 자동 조정되었습니다.');
             }
          }
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
          if (reportMode === 'FDR' && addManStart.length === 4 && std.length === 4) {
            const stdMin = toMinutes(std);
            const inputMin = toMinutes(addManStart);
            if (inputMin < stdMin + 60) {
              addManStart = toHHMM((stdMin + 60) % 1440);
              triggerTimeAlert(`🚨 [ADD MAN] 시작 시간은 STD 기준 최소 1시간 이후로 자동 보정됩니다.`);
            }
          }
          if (reportMode === 'FDR' && addManStart.length === 4 && atd.length === 4) {
            const atdMin = toMinutes(atd) + (atdNextDay ? 1440 : 0);
            if (toMinutes(addManStart) > atdMin) addManStart = atd;
          }
          updated.start = addManStart;
        }

        if (field === 'end') {
          let addManEnd = processedVal;
          let addManEndNextDay = updated.endNextDay;
          if (autoNextDay) addManEndNextDay = true;
          else if (forceUncheck) addManEndNextDay = false;

          if (reportMode === 'FDR' && addManEnd.length === 4 && atd.length === 4) {
            const inputMin = toMinutes(addManEnd) + (addManEndNextDay ? 1440 : 0);
            const atdMin = toMinutes(atd) + (atdNextDay ? 1440 : 0);
            if (inputMin > atdMin) {
              addManEnd = atd;
              addManEndNextDay = atdNextDay;
              triggerTimeAlert(`🚨 [ADD MAN] 종료 시간이 ATA(${atd})를 초과하여 자동 보정되었습니다.`);
            }
          }
          updated.end = addManEnd;
          updated.endNextDay = addManEndNextDay;
        }

        if (updated.role === 'EDI' && updated.start.length === 4 && updated.end.length === 4) {
           let sMin = toMinutes(updated.start);
           let eMin = toMinutes(updated.end) + (updated.endNextDay ? 1440 : 0);
           if (eMin < sMin) eMin += 1440;
           if (eMin - sMin > 60) {
             updated.start = toHHMM((eMin - 60) % 1440);
             triggerTimeAlert('🚨 EDI 직원의 ADD MAN은 최대 1시간을 초과할 수 없어 자동 조정되었습니다.');
           }
        }

        return updated;
      }
      return item;
    }));

    setHdTimes(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item };
        if (field === 'start') updated.start = processedVal;
        if (field === 'end') {
          updated.end = processedVal;
          if (autoNextDay) updated.endNextDay = true;
          else if (forceUncheck) updated.endNextDay = false;
        }
        return updated;
      }
      return item;
    }));
  };

  const formatAviationDate = (dateString: string) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return '';
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const mIdx = parseInt(parts[1], 10) - 1;
    return `${parts[2]}${months[mIdx]}${parts[0].slice(-2)}`;
  };

  const handleAddStaff = () => {
    const newId = Date.now() + Math.random();
    setHdTimes(prev => [...prev, { id: newId, typeLabel: '추가인원', name: '', start: '', end: '', endNextDay: false }]);
    setAddManList(prev => [...prev, { id: newId, role: 'AGNT', detailLabel: '추가인원', name: '', start: '', end: '', endNextDay: false }]);
  };

  const handleRemoveStaff = (id: number) => {
    setHdTimes(prev => prev.filter(h => h.id !== id));
    setAddManList(prev => prev.filter(a => a.id !== id));
  };

  const handleAddHdStaff = () => handleAddStaff();
  const handleRemoveHdStaff = (id: number) => handleRemoveStaff(id);

  const handleFhrTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value;
    
    const shortTypes = ['FERRY OUT', 'FERRY IN', '자발적 하기', '비자발적 하기', 'DIVERT', 'BUS HNDL'];
    const isCurrentlyShort = shortTypes.includes(fhrType);
    const willBeShort = shortTypes.includes(type);
    if (isCurrentlyShort !== willBeShort) {
      resetStaffList('FHR', type);
    }

    setFhrType(type);
    setTimeline(getTimelineObjects(fhrTimelinesMap[type] || []));
    
    if (type === '자발적 하기') {
      setFhrSubjectSummary('건강 상의 사유로 인한 자발적 하기 발생'); 
      if (isDefaultRzn(fhrRzn)) setFhrRzn('건강 상 사유에 따른 승객 요청으로 1 PAX OFLD');
      if (isDefaultSpcl(othrSpcl)) setOthrSpcl('');
      if (isDefaultActn(fhrActn)) setFhrActn('위 사유로 승객 인터뷰 진행 및 상태 확인하였으며, 구급대 지원 요청없이 하기 진행\n하기 완료 후 OFLD 업무 절차에 따라 역사열 진행');
    } else if (type === '비자발적 하기') {
      setFhrSubjectSummary('승객 비자발적 하기 발생'); 
      if (isDefaultRzn(fhrRzn)) setFhrRzn('회사 규정에 따른 비자발적 하기 조치 진행');
      if (isDefaultSpcl(othrSpcl)) setOthrSpcl('');
      if (isDefaultActn(fhrActn)) setFhrActn('위 사유로 승객 인터뷰 진행 및 상태 확인하였으며, 구급대 지원 요청없이 하기 진행\n하기 완료 후 OFLD 업무 절차에 따라 역사열 진행');
    } else if (type === 'FERRY OUT' || type === 'FERRY IN') {
      setFerryType('국제선'); 
      if (isDefaultSpcl(othrSpcl)) setOthrSpcl('NIL');
    } else if (type === 'RAMP RETURN') {
      setFhrSubjectSummary('항공기 정비로 인한 RAMP RTN'); 
      if (isDefaultRzn(fhrRzn)) setFhrRzn('정비로 인한 RAMP RETURN'); 
      if (isDefaultSpcl(othrSpcl)) setOthrSpcl('NIL');
    } else if (type === 'DIVERT') {
      setFhrSubjectSummary('GMP CURFEW로 인한 ICN DIVRT'); 
      if (isDefaultRzn(fhrRzn)) setFhrRzn('GMP CURFEW로 인한 ICN DIVRT'); 
      if (isDefaultSpcl(othrSpcl)) setOthrSpcl('HOT CLM 승객 발생');
    } else if (type === '결항') {
      setFhrSubjectSummary('기상악화로 인한 결항'); 
      if (isDefaultRzn(fhrRzn)) setFhrRzn('기상악화로 인한 결항'); 
      if (isDefaultSpcl(othrSpcl)) setOthrSpcl('NIL');
    } else if (type === 'BUS HNDL') {
      setFhrSubjectSummary('I/B 지연 도착으로 인한 BUS HNDL'); 
      if (isDefaultRzn(fhrRzn)) setFhrRzn('연결편 항공기 지연 도착으로 인한 BUS HNDL');
      if (isDefaultSpcl(othrSpcl)) setOthrSpcl('COMPLAIN : NIL');
      if (isDefaultActn(fhrActn)) setFhrActn('입국장 교통편 안내');
    } else if (type === '기타(직접 입력)') {
      setFhrSubjectSummary(''); 
      if (isDefaultRzn(fhrRzn)) setFhrRzn(''); 
      if (isDefaultSpcl(othrSpcl)) setOthrSpcl('');
    }
  };

  const generateMailContent = () => {
    const isFhr = reportMode === 'FHR';
    const isOfld = isFhr && (fhrType === '자발적 하기' || fhrType === '비자발적 하기');

    const avDate = formatAviationDate(date);
    const formattedEtd = etd ? `${etd}L${etdNextDay ? '(+1)' : ''}` : '----L';
    const formattedAtd = atd ? `${atd}L${atdNextDay ? '(+1)' : ''}` : '----L';
    const formattedRegNo = regNo ? `HL${regNo}` : '---';
    const formattedFlightNum = flightNum ? `${airline}${flightNum.toUpperCase()}` : `${airline}---`;
    const finalRoute = getFinalRoute();

    const subjectPrefix = isFhr ? `F.H.R ${formattedFlightNum} ON ${avDate} ${finalRoute}` : `F.D.R ${formattedFlightNum} ON ${avDate} ${finalRoute}`;
    const subjectSuffix = isFhr ? fhrSubjectSummary : dlaSummary;
    const subject = `${subjectPrefix} /// ( ${subjectSuffix} )`;

    const othrSpclText = othrSpcl ? othrSpcl.split('\n').map(l => `   ○ ${l}`).join('\n') : '   ○ NIL';
    const hdTimeLines = hdTimes.filter(h => h.name || h.start || h.end).map(h => `   ○ ${h.start || '----'}L - ${h.end || '----'}L${h.endNextDay ? '(+1)' : ''} : ${h.name}`).join('\n');

    const activeStaffs = addManList.filter(s => s.name && s.start && s.end);
    const counts: Record<string, number> = { SPVR: 0, AGNT: 0, EDI: 0 };
    activeStaffs.forEach(s => { counts[s.role] = (counts[s.role] || 0) + 1; });
    const addManHeader = `   GATE SPVR ${counts['SPVR'] || 0} / AGNT ${counts['AGNT'] || 0} / EDI(오피스) ${counts['EDI'] || 0}`;

    const formattedAddManLines = activeStaffs.map(s => {
      let startMin = toMinutes(s.start);
      let endMin = toMinutes(s.end) + (s.endNextDay ? 1440 : 0);
      if (endMin < startMin - 300 && !s.endNextDay) endMin += 1440;

      const diffMin = Math.max(0, endMin - startMin);
      const diffH = Math.floor(diffMin / 60);
      const diffM = diffMin % 60;
      const durStr = `${String(diffH).padStart(2, '0')} HR ${String(diffM).padStart(2, '0')} MINS`;

      const timeSlotStr = `${formattedFlightNum} (${s.start}L${s.endNextDay && s.start < s.end ? '' : ''} - ${s.end}L${s.endNextDay ? '(+1)' : ''}) : ${s.role === 'EDI' ? 'EDI' : 'AGT'} ${s.name}`;
      return `   ○ ${timeSlotStr.padEnd(32, ' ')} // ${durStr}`;
    });

    const addManText = formattedAddManLines.length > 0 ? `${addManHeader}\n${formattedAddManLines.join('\n')}` : `   ${addManHeader}\n   ○ NIL`;

    const formattedTimelineLines = timeline.map(t => {
      const timeStr = (t.time && t.time.length === 4) ? `${t.time}L` : '----L';
      const nextStr = t.nextDay ? '(+1)' : '';
      return `   ○ ${timeStr}${nextStr} : ${t.content || '내용 미입력'}`;
    }).join('\n');

    let blocks = [];
    blocks.push({ title: "A/C TYPE N REG", content: `   ○ ${getFinalAcType() || '---'} / ${formattedRegNo}` });
    
    blocks.push({
      title: `${lblS} / ${lblE} / ${lblA}`,
      content: `   ○ ${std ? std+'L' : '----L'} / ${formattedEtd} / ${formattedAtd}`
    });

    if (isFhr) {
      if (fhrType === 'BUS HNDL') {
        const dlaTimeStr = getDlaTimeStr() || '00HR 00MINS';
        blocks.push({ title: "DLA TIME N RSN", content: `   ○ DLA TIME : ${dlaTimeStr}\n   ○ ${fhrRzn.split('\n').join('\n   ○ ')}` });
      } else {
        blocks.push({ title: "RZN", content: fhrRzn ? fhrRzn.split('\n').map(l => `   ○ ${l}`).join('\n') : '   ○ NIL' });
      }
    } else {
      let dlaNoticeText = '   ○ DLA SET NOTICE : NIL';
      if (dlaNoticeSource !== 'NIL') {
        dlaNoticeText = `   ○ DLA SET NOTICE : ${dlaNoticeTime ? dlaNoticeTime + 'L' : '----L'} (${dlaNoticeSource})`;
      }
      const dlaReasonText = dlaReason ? dlaReason.split('\n').map(l => `   ○ ${l}`).join('\n') : '   ○ NIL';
      const dlaTimeStr = getDlaTimeStr() || '00HR 00MINS';
      blocks.push({ title: "DLA TIME N RSN", content: `   ○ DLA TIME : ${dlaTimeStr}\n${dlaNoticeText}\n${dlaReasonText}` });
    }

    blocks.push({ title: "PAX STS", content: `   ○ CFG : ${cfg || '미입력'}\n   ○ BKG : ${isFerry ? '0' : bkg || '미입력'}\n   ○ OBD : ${getFormattedObd() || '미입력'}` });
    blocks.push({ title: "H/D STS", content: formattedTimelineLines || '   ○ NIL' });

    if (isOfld || fhrType === 'BUS HNDL') {
      if (isOfld) {
        const displayName = (fhrPaxNm && fhrPaxNm.trim() !== '') ? fhrPaxNm : '미입력';
        const displayCount = (fhrPaxCount && parseInt(fhrPaxCount, 10) > 0) ? fhrPaxCount : '1';
        blocks.push({ title: "PAX NM", content: `   ○ ${displayName} *TCP ${displayCount}` });
      }
      blocks.push({ title: "ACTN TAKEN", content: fhrActn ? fhrActn.split('\n').map(l => `   ○ ${l}`).join('\n') : '   ○ NIL' });
    }

    blocks.push({ title: "OTHR SPCL / COMPLAIN", content: othrSpclText });
    
    blocks.push({ title: "H/D TIME", content: hdTimeLines || '   ○ NIL' });
    blocks.push({ title: "ADD MAN", content: addManText });

    const body = blocks.map((b, i) => `${i + 1}. ${b.title}\n${b.content}`).join('\n\n');
    
    let ccAddress = '인천진에어 <icnlj@airkorea.biz>';
    if (airline === 'RS') ccAddress = '인천그룹사 총괄 <icnljofc2@airkorea.biz>, ICNRS <icnrs@airkorea.biz>';
    if (airline === 'BX') ccAddress = '인천그룹사 총괄 <icnljofc2@airkorea.biz>, ICNBX <icnbxak@airkorea.biz>';

    const emailHeader = `받는 사람 :\n수입관리 <income@airkorea.biz>, 지연레포트 <fhr@airkorea.biz>\n참조 :\n${ccAddress}\n제목 :\n${subject}\n\n────────────────────────────────────────\n      ✂️ 수신처 및 제목 복붙 후 지워주세요 ✂️      \n────────────────────────────────────────`;
    
    const pureBodyOnly = `${emailHeader}\n\n${body}\n\nB/RGDS//${writerName ? writerName.toUpperCase() : '이름입력필요'} (${writerPhone || '번호입력필요'})`;

    return { bodyOnlyText: pureBodyOnly };
  };

  const handleOpenPreview = () => {
    try {
      const errors: string[] = [];
      const isFhr = reportMode === 'FHR';

      if (!flightNum) errors.push('편명');
      if (!date) errors.push('운항일');
      if (!getOriginCode() || getOriginCode() === 'XXX') errors.push('출발지');
      if (!getDestCode() || getDestCode() === 'XXX') errors.push('도착지');
      if (!getFinalAcType()) errors.push('A/C TYPE');
      if (!regNo || regNo.length < 4) errors.push('REG(기호 4자리)');
      if (!spot) errors.push('SPOT');
      if (!std) errors.push(lblS);
      if (!etd) errors.push(lblE);
      if (!atd) errors.push(lblA);
      if (!cfg) errors.push('CFG');
      
      if (!isFerry && !bkg) errors.push('BKG');
      if (!isFerry && !obd) errors.push('OBD');

      if (timeline.some(t => t.time.length < 4)) errors.push('타임라인 미수정 "시간" 존재');

      if (!isFhr) {
        if (!dlaSummary || dlaSummary.trim() === '인한 출발 지연') errors.push('지연 요약(제목용)');
        if (dlaNoticeSource !== 'NIL' && !dlaNoticeTime) errors.push('DLA SET NOTICE 시간');
        if (!dlaReason || dlaReason.trim() === '인한 출발 지연') errors.push('지연 사유(상세)');
      }

      if (isFhr && (fhrType === '자발적 하기' || fhrType === '비자발적 하기')) {
        if (!fhrPaxNm || fhrPaxNm.trim() === '') errors.push('해당 승객 이름 (PAX NM)');
        if (!fhrPaxCount || fhrPaxCount.trim() === '' || parseInt(fhrPaxCount, 10) < 1) {
          errors.push('인원(TCP) (1명 이상 필수)');
        }
      }

      if (isEdiRequired()) {
        const hasEdiStaff = addManList.some(s => s.role === 'EDI' && s.name.trim() !== '');
        if (!hasEdiStaff) {
          errors.push(reportMode === 'FDR' ? 'EDI(오피스) 직원 [FDR 출항보고 필수]' : 'EDI(오피스) 직원 [국제선 FERRY 출/입항보고 필수]');
        }
      }

      if (!writerName) errors.push('작성자 이름 (영문 권장)');
      if (!writerPhone) errors.push('작성자 전화번호');

      setMissingFields(errors);
      setPreviewText(generateMailContent().bodyOnlyText);
      setShowPreviewModal(true);
    } catch (err: any) {
      alert("모달 오류: " + err.message);
    }
  };

  const handleFinalCopy = async () => {
    try {
      await navigator.clipboard.writeText(previewText);
      alert('✅ [전체 내용]이 완벽하게 복사되었습니다!\n메일 본문란에 바로 붙여넣기 하세요.');
      handleSaveName(introWriterName.trim() || writerName.trim());
      sendLogToGoogleSheet(previewText);
      saveToLocalStorage(false); 
      setShowPreviewModal(false);
    } catch {
      alert('🚨 자동 복사를 지원하지 않는 브라우저(카카오톡 등)입니다.\n\n상단의 본문 텍스트를 길게 눌러서 [전체 선택] 후 직접 복사해 주세요.');
    }
  };

  const hasKoreanName = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(writerName);
  
  const isObdExceedsCfg = cfg && obd && !isFerry && (parseInt(obd, 10) > parseInt(cfg, 10));

  const getAirlineStyle = (code: string) => {
    if (code === 'LJ') {
      return {
        bg: 'bg-lime-100 text-lime-800 border-lime-300',
        badge: 'bg-lime-500 text-white',
        selectBg: 'bg-lime-50 text-lime-900 border-lime-400'
      };
    }
    if (code === 'RS') {
      return {
        bg: 'bg-teal-100 text-teal-800 border-teal-300',
        badge: 'bg-teal-600 text-white',
        selectBg: 'bg-teal-50 text-teal-900 border-teal-400'
      };
    }
    if (code === 'BX') {
      return {
        bg: 'bg-sky-100 text-sky-800 border-sky-300',
        badge: 'bg-sky-500 text-white',
        selectBg: 'bg-sky-50 text-sky-900 border-sky-400'
      };
    }
    return { bg: 'bg-gray-100 text-gray-700 border-gray-300', badge: 'bg-gray-500 text-white', selectBg: 'bg-white' };
  };

  const currentAlStyle = getAirlineStyle(airline);

  const InfoBtn = ({ code }: { code: string }) => {
    const info = FIELD_TOOLTIPS[code];
    if (!info) return null;
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setActiveTooltip(info);
        }}
        className="ml-1 text-gray-400 hover:text-blue-600 font-bold text-[11px] cursor-pointer inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-gray-100 hover:bg-blue-100 border border-gray-300"
        title={info.title}
      >
        ⓘ
      </button>
    );
  };

  if (step === 'intro') {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen text-slate-800 flex flex-col justify-between p-6 font-sans relative">
        <div className="space-y-6 pt-6">
          <div className="flex justify-between items-center">
            <span className="bg-blue-100 text-blue-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest">
              AIR KOREA GROUND HANDLING
            </span>

            <button 
              type="button" 
              onClick={() => setShowAdminModal(true)} 
              className="text-[10px] text-gray-400 hover:text-slate-700 underline cursor-pointer"
            >
              (관리자)
            </button>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 leading-snug">
              ✈️에어코리아 인천 그룹사지원센터
            </h1>
            <h2 className="text-xl font-black tracking-tight text-slate-900 leading-snug w-full">
              Smart Flight Irregularity Report Tool
            </h2>
            <p className="text-slate-500 text-xs pt-1">
              현업 실무 환경에 맞춘 빠르고 정확한 FDR / FHR 작성 도구입니다.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-4 shadow-sm">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 block">1. 보고서 종류 선택</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleReportModeChange('FDR')}
                  className={`py-3 px-2 rounded-xl font-bold transition flex flex-col items-center justify-center gap-0.5 border cursor-pointer ${
                    reportMode === 'FDR' 
                      ? 'bg-red-500 text-white border-red-500 shadow-md' 
                      : 'bg-white text-slate-700 border-gray-200 hover:bg-red-50'
                  }`}
                >
                  <span className="text-sm">FDR</span>
                  <span className={`text-[9px] font-medium tracking-tighter ${reportMode === 'FDR' ? 'text-red-100' : 'text-slate-400'}`}>FLIGHT DELAY REPORT</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleReportModeChange('FHR')}
                  className={`py-3 px-2 rounded-xl font-bold transition flex flex-col items-center justify-center gap-0.5 border cursor-pointer ${
                    reportMode === 'FHR' 
                      ? 'bg-blue-500 text-white border-blue-500 shadow-md' 
                      : 'bg-white text-slate-700 border-gray-200 hover:bg-blue-50'
                  }`}
                >
                  <span className="text-sm">FHR</span>
                  <span className={`text-[9px] font-medium tracking-tighter ${reportMode === 'FHR' ? 'text-blue-100' : 'text-slate-400'}`}>FLIGHT HANDLING REPORT</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-red-600 block">
                2. 운항일 확인 (날짜 주의)
              </label>
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                className="w-full bg-red-50/50 border border-red-300 rounded-xl px-3 py-2.5 text-xs font-bold text-red-600 outline-none focus:border-red-500 shadow-inner cursor-pointer" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 block">3. 담당 및 보고 직원 이름</label>
              <div className="flex gap-2">
                <select
                  value={airline}
                  onChange={handleAirlineChange}
                  className={`w-1/3 border rounded-xl px-2 py-2.5 text-xs font-extrabold outline-none shadow-inner cursor-pointer transition-colors ${currentAlStyle.selectBg}`}
                >
                  <option value="LJ" className="bg-white text-slate-800">LJ (진에어)</option>
                  <option value="RS" className="bg-white text-slate-800">RS (에어서울)</option>
                  <option value="BX" className="bg-white text-slate-800">BX (에어부산)</option>
                </select>
                <input 
                  type="text" 
                  placeholder="보고 직원 이름" 
                  value={introWriterName} 
                  onChange={e => setIntroWriterName(e.target.value)} 
                  className="w-2/3 bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 shadow-inner placeholder-gray-400" 
                />
              </div>
              
              {savedNames.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5 items-center">
                  <span className="text-[10px] text-gray-400 font-semibold mr-1">최근 사용:</span>
                  {savedNames.map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setIntroWriterName(n)}
                      className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 hover:bg-blue-100 cursor-pointer transition"
                    >
                      <span>{n}</span>
                      <span 
                        onClick={(e) => removeSavedName(n, e)} 
                        className="text-blue-300 hover:text-red-500 font-normal ml-0.5"
                        title="기록 삭제"
                      >
                        ×
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pb-4 pt-2 space-y-2">
          <button
            type="button"
            onClick={() => {
              if (!introWriterName.trim()) {
                alert('보고 직원 이름을 입력해 주세요.');
                return;
              }
              handleSaveName(introWriterName);
              sendIntroLogToGoogleSheet(introWriterName, reportMode, airline);
              setStep('main');
            }}
            className={`w-full text-white py-4 rounded-2xl font-bold text-sm shadow-xl active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer ${
              reportMode === 'FDR' ? 'bg-red-500 hover:bg-red-400' : 'bg-blue-500 hover:bg-blue-400'
            }`}
          >
            <span>{reportMode} 새롭게 작성 시작하기</span>
            <span>→</span>
          </button>

          <button
            type="button"
            onClick={() => setStep('myRecords')}
            className="w-full text-slate-700 bg-white border border-gray-300 py-3 rounded-2xl font-bold text-sm shadow-sm active:bg-gray-50 transition flex items-center justify-center gap-2 cursor-pointer mt-1"
          >
            <span>💾 내 기기에 저장된 기록 불러오기</span>
          </button>

          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="w-full text-gray-500 bg-gray-50 border border-gray-200 py-2.5 rounded-2xl font-bold text-xs shadow-sm hover:bg-gray-100 transition flex items-center justify-center gap-1.5 cursor-pointer mt-1"
          >
            <span>📖 작성 가이드 및 주의사항 확인하기</span>
          </button>
          
          <div className="flex flex-col items-center gap-1.5 mt-2">
            <div className="text-center text-[10px] text-gray-400 font-mono">
              CREATED BY SH.CHO (Ver 1.0)
            </div>
            <button
              type="button"
              onClick={() => window.open('mailto:shcho1219@airkorea.biz?subject=[스마트 리포트 툴] 오류 제보 및 건의사항')}
              className="text-[10px] text-gray-500 underline hover:text-gray-700 cursor-pointer"
            >
              💡 시스템 오류 제보 및 건의사항 남기기
            </button>
          </div>
        </div>

        {showGuideModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-extrabold text-sm text-slate-900">📖 실무 작성 가이드 및 팁</h3>
                <button type="button" onClick={() => setShowGuideModal(false)} className="text-lg text-gray-400 hover:text-slate-700 cursor-pointer">&times;</button>
              </div>
              <div className="text-[11px] text-slate-700 space-y-2.5 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
                <p>✈️ <strong>FDR / FHR 생성기 실무 가이드</strong></p>
                <ul className="list-disc pl-4 space-y-1.5 text-gray-700">
                  <li><strong>타임라인 순서 변경 (모바일 지원):</strong> 타임라인 항목 앞의 <code>≡</code> 아이콘을 <strong>1초간 꾹 누른 뒤 위아래로 끌면</strong> 손쉽게 순서가 변경됩니다.</li>
                  <li><strong>시간 입력 팁 (2400):</strong> 타임라인 등에서 <code>2400</code>을 입력하면 <code>0000</code>으로 바뀌며 익일(<code>+1</code>)이 체크됩니다.</li>
                  <li><strong>용어 설명 (ⓘ 아이콘):</strong> CFG, BKG, OBD 등 각 입력 항목 옆 <code>ⓘ</code> 아이콘을 누르면 신입 직원을 위한 상세 용어 설명이 표시됩니다.</li>
                  <li><strong>EDI(오피스) 직원 필수 입력:</strong> FDR(출항보고) 및 국제선 FERRY OUT(출항보고), 국제선 FERRY IN(입항보고) 작성 시에는 EDI 직원을 반드시 ADD MAN에 입력해야 합니다.</li>
                </ul>
              </div>
              <button 
                type="button" 
                onClick={() => setShowGuideModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs shadow cursor-pointer mt-2"
              >
                확인 완료
              </button>
            </div>
          </div>
        )}

        {showAdminModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-5 w-full max-w-xs shadow-2xl space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900">관리자 인증</h3>
              <p className="text-[11px] text-gray-500">관리자 비밀번호를 입력해주세요.</p>
              <input 
                type="password" 
                placeholder="******" 
                value={adminPwInput} 
                onChange={e => setAdminPwInput(e.target.value)}
                className="w-full border p-2.5 rounded-xl text-center font-mono text-sm tracking-widest outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <div className="flex gap-2 pt-1">
                <button 
                  type="button" 
                  onClick={() => { setShowAdminModal(false); setAdminPwInput(''); }}
                  className="flex-1 py-2.5 rounded-xl bg-gray-200 text-gray-700 font-bold text-xs cursor-pointer"
                >
                  취소
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    if (adminPwInput === '1017') {
                      setShowAdminModal(false);
                      setAdminPwInput('');
                      fetchLogsFromSheet(); 
                      setStep('logs');
                    } else {
                      alert('비밀번호가 틀렸습니다.');
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow cursor-pointer"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (step === 'myRecords') {
    const filteredRecords = localRecords.filter((record) => {
      const q = recordSearchQuery.toLowerCase();
      return (
        record.summaryTitle.toLowerCase().includes(q) ||
        record.detail.toLowerCase().includes(q) ||
        record.timestamp.toLowerCase().includes(q)
      );
    });

    return (
      <div className="max-w-md mx-auto bg-gray-50 min-h-screen text-slate-800 p-4 font-sans flex flex-col">
        <div className="flex justify-between items-center mb-3 border-b pb-3">
          <h2 className="font-extrabold text-[15px] text-slate-900">💾 나의 기기 저장 기록</h2>
          <button 
            type="button" 
            onClick={() => setStep('intro')} 
            className="bg-slate-800 text-white px-3 py-1.5 rounded-lg font-bold text-[11px] cursor-pointer"
          >
            ← 홈으로
          </button>
        </div>

        <div className="mb-3">
          <input
            type="text"
            placeholder="🔍 편명, 날짜 또는 사유로 검색..."
            value={recordSearchQuery}
            onChange={(e) => setRecordSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 shadow-inner"
          />
        </div>

        {filteredRecords.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
            <span className="text-3xl">📭</span>
            <span className="text-sm font-bold">검색 결과가 없습니다.</span>
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto pb-8 flex-1">
            {filteredRecords.map((record) => (
              <div key={record.id} className={`bg-white border rounded-xl p-3 shadow-sm flex flex-col gap-2 ${record.summaryTitle.includes('⚠️ [임시저장]') ? 'border-orange-300 bg-orange-50/30' : ''}`}>
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 mb-0.5">{record.timestamp}</span>
                    <span className={`font-extrabold text-xs ${record.summaryTitle.includes('⚠️ [임시저장]') ? 'text-orange-600' : 'text-slate-800'}`}>{record.summaryTitle}</span>
                    <span className="text-[10px] text-gray-600 mt-0.5 break-all line-clamp-1">{record.detail}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => deleteLocalRecord(record.id)} 
                    className="text-red-400 hover:text-red-600 p-1 cursor-pointer" 
                    title="기록 삭제"
                  >
                    🗑️
                  </button>
                </div>
                <button 
                  type="button" 
                  onClick={() => handleLoadRecord(record.state)} 
                  className={`w-full font-bold py-2 rounded-lg text-[11px] transition cursor-pointer ${
                    record.summaryTitle.includes('⚠️ [임시저장]') 
                    ? 'bg-orange-100 text-orange-800 hover:bg-orange-200 border border-orange-200' 
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                  }`}
                >
                  이 양식 그대로 불러오기
                </button>
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
          <div className="flex items-center gap-3">
            <h2 className="font-extrabold text-sm text-slate-900">📊 ☁️ 통합 클라우드 대시보드 (구글 시트 연동)</h2>
            <button 
              type="button" 
              onClick={fetchLogsFromSheet} 
              className="bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-lg font-bold text-[10px] hover:bg-green-100 cursor-pointer flex items-center gap-1"
            >
              🔄 데이터 새로고침
            </button>
          </div>
          <button 
            type="button" 
            onClick={() => setStep('intro')} 
            className="bg-slate-800 text-white px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer"
          >
            돌아가기
          </button>
        </div>

        <div className="mb-4 bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-yellow-800 text-[11px] leading-relaxed font-medium">
          <strong>※ 주의사항:</strong> 이 화면은 구글 시트에 누적된 전체 직원의 실시간 데이터를 조회하는 '읽기 전용' 모니터링 뷰입니다.<br/>
          웹에서 데이터를 삭제하면 중앙 원본 엑셀 행번호가 꼬일 수 있어 <strong>삭제 기능은 제한</strong>되어 있습니다. 잘못 작성된 기록의 수정 및 삭제는 관리자가 직접 <strong>[구글 스프레드시트 파일]</strong>을 열어 편집해 주세요.
        </div>

        {isLoadingLogs ? (
          <div className="bg-white p-12 rounded-xl text-center text-blue-600 font-bold border shadow-sm text-sm flex justify-center items-center gap-2">
            <span>클라우드(구글 시트)에서 실시간 데이터를 불러오는 중입니다...</span>
          </div>
        ) : sheetLogs.length === 0 ? (
          <div className="bg-white p-8 rounded-xl text-center text-gray-400 border shadow-sm">
            아직 구글 시트에 기록된 로그가 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl border shadow-sm">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-[11px] border-b">
                  <th className="p-3 font-extrabold text-blue-900">순번</th>
                  <th className="p-3 font-extrabold text-blue-900">보고 직원 이름</th>
                  <th className="p-3 font-bold">작성 일시</th>
                  <th className="p-3 font-bold">보고서</th>
                  <th className="p-3 font-bold">편명</th>
                  <th className="p-3 font-bold">운항일</th>
                  <th className="p-3 font-bold">구간</th>
                  <th className="p-3 font-bold">기종</th>
                  <th className="p-3 font-bold">REG</th>
                  <th className="p-3 font-bold">SPOT</th>
                  <th className="p-3 font-bold">CFG / BKG / OBD</th>
                  <th className="p-3 font-bold">지연요약/FHR유형</th>
                  <th className="p-3 font-bold">연락처</th>
                </tr>
              </thead>
              <tbody className="divide-y text-[11px] text-slate-800">
                {sheetLogs.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-extrabold text-slate-500 bg-slate-50">{row[0] || '-'}</td>
                    <td className="p-3 font-extrabold text-blue-900 bg-blue-50/50">{row[2] || '-'}</td>
                    <td className="p-3 font-mono text-gray-500 text-[10px]">{row[1] || '-'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${row[3] === 'FDR' ? 'bg-red-500' : 'bg-blue-500'}`}>
                        {row[3] || '-'}
                      </span>
                    </td>
                    <td className="p-3 font-bold">{row[4] || '-'}</td>
                    <td className="p-3">{row[5] || '-'}</td>
                    <td className="p-3 font-mono font-semibold">{row[6] || '-'}</td>
                    <td className="p-3">{row[7] || '-'}</td>
                    <td className="p-3 font-mono">{row[8] || '-'}</td>
                    <td className="p-3">{row[9] || '-'}</td>
                    <td className="p-3 font-mono">{row[10] || '-'}</td>
                    <td className="p-3 text-slate-800 font-semibold">{row[11] || '-'}</td>
                    <td className="p-3 font-mono text-gray-600">{row[12] || '-'}</td>
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
          <div className="bg-white rounded-xl p-4 w-full max-w-xs shadow-2xl space-y-2 border">
            <div className="flex justify-between items-center border-b pb-1.5">
              <h4 className="font-extrabold text-xs text-blue-900 flex items-center gap-1">
                <span>💡</span> {activeTooltip.title}
              </h4>
              <button
                type="button"
                onClick={() => setActiveTooltip(null)}
                className="text-gray-400 hover:text-slate-800 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>
            <p className="text-[11px] text-slate-700 leading-relaxed pt-1">
              {activeTooltip.desc}
            </p>
            <button
              type="button"
              onClick={() => setActiveTooltip(null)}
              className="w-full py-1.5 rounded-lg bg-blue-600 text-white font-bold text-[10px] shadow mt-2 cursor-pointer"
            >
              확인
            </button>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 bg-white shadow-sm px-3 py-2 border-b space-y-1.5">
        <div className="flex items-center justify-between bg-gray-100 rounded-lg p-2 mb-1">
          <button
            type="button"
            onClick={() => {
              if (window.confirm("초기 화면으로 돌아가시겠습니까?\n작성된 내용이 지워집니다.")) {
                clearFormFields();
                setStep('intro');
              }
            }}
            className="text-[10px] font-bold text-slate-600 bg-white px-2.5 py-1.5 rounded shadow-sm hover:bg-slate-50 cursor-pointer"
          >
            ← 홈/설정 변경
          </button>
          <div className="text-right">
            <span className="text-[10px] text-gray-400 block">
              보고 직원: <strong className="text-slate-700">{airline}({getAirlineLabel(airline)}) {introWriterName || '미입력'}</strong>
            </span>
          </div>
        </div>

        <div className="px-1 text-center">
          <span className={`inline-block w-full py-2 rounded-xl text-white font-extrabold tracking-wider text-sm shadow-sm ${
            reportMode === 'FDR' ? 'bg-red-500' : 'bg-blue-500'
          }`}>
            {reportMode === 'FDR' ? 'FLIGHT DELAY REPORT' : 'FLIGHT HANDLING REPORT'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 text-left mb-1.5">
          <div className="flex flex-col">
            <label className="text-[10px] text-gray-500 font-bold block mb-0.5">편명</label>
            <div className="flex border rounded bg-white overflow-hidden h-8">
              <span className={`font-extrabold text-[11px] px-2.5 min-w-[42px] border-r flex items-center justify-center tracking-wider transition-colors ${currentAlStyle.bg}`}>
                {airline}
              </span>
              <input 
                type="text" 
                placeholder="001" 
                value={flightNum} 
                onChange={e => setFlightNum(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, ''))} 
                className="w-full px-1.5 text-center outline-none text-xs uppercase font-bold" 
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] text-red-600 font-bold block mb-0.5">운항일 <span className="text-[8px] text-red-500 font-normal">(날짜주의)</span></label>
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              className="w-full border border-red-300 bg-red-50 text-red-900 font-semibold px-0.5 rounded text-[10px] h-8 text-center cursor-pointer" 
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1.5 text-left mb-1.5 items-end">
          <div className="col-span-2 flex flex-col">
            <label className="text-[10px] text-gray-500 font-bold block mb-0.5">구간 (출발 - 도착)</label>
            <div className="flex items-center gap-0.5 h-8">
              <div className="flex-1 flex border rounded bg-white h-full overflow-hidden">
                <select 
                  value={originType} 
                  onChange={e => setOriginType(e.target.value)}
                  className="bg-blue-50 text-blue-900 font-bold text-[9px] px-0.5 border-r outline-none cursor-pointer"
                >
                  <option value="ICN">ICN</option>
                  <option value="GMP">GMP</option>
                  <option value="CUSTOM">직접 입력</option>
                </select>
                {originType === 'CUSTOM' ? (
                  <input 
                    type="text" 
                    maxLength={3} 
                    placeholder="출발" 
                    value={originCustom} 
                    onChange={e => setOriginCustom(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))} 
                    className="w-full px-0.5 text-center outline-none text-[10px] uppercase font-bold" 
                  />
                ) : (
                  <span className="w-full text-center flex items-center justify-center font-bold text-[10px] text-blue-700 bg-blue-50/30">{originType}</span>
                )}
              </div>

              <span className="text-gray-400 font-bold text-[10px]">-</span>

              <div className="flex-1 flex border rounded bg-white h-full overflow-hidden">
                <select 
                  value={destType} 
                  onChange={e => setDestType(e.target.value)}
                  className="bg-indigo-50 text-indigo-900 font-bold text-[9px] px-0.5 border-r outline-none cursor-pointer"
                >
                  <option value="CUSTOM">직접 입력</option>
                  <option value="ICN">ICN</option>
                  <option value="GMP">GMP</option>
                </select>
                {destType === 'CUSTOM' ? (
                  <input 
                    type="text" 
                    maxLength={3} 
                    placeholder="도착" 
                    value={destCustom} 
                    onChange={e => setDestCustom(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))} 
                    className="w-full px-0.5 text-center outline-none text-[10px] uppercase font-bold" 
                  />
                ) : (
                  <span className="w-full text-center flex items-center justify-center font-bold text-[10px] text-indigo-700 bg-indigo-50/30">{destType}</span>
                )}
              </div>
            </div>
          </div>

          <div className="col-span-1 flex flex-col">
            <label className="text-[9px] text-gray-400 mb-0.5 font-bold flex items-center">
              REG No. <InfoBtn code="REG" />
            </label>
            <div className="flex border rounded bg-white overflow-hidden h-8">
              <span className="bg-gray-100 text-gray-500 font-bold text-[8px] px-0.5 border-r flex items-center">HL</span>
              <input 
                type="text" 
                inputMode="numeric" 
                maxLength={4} 
                placeholder="0000" 
                value={regNo} 
                onChange={e => setRegNo(e.target.value.replace(/[^0-9]/g, ''))} 
                className="w-full px-0.5 text-center outline-none text-[11px] font-mono" 
              />
            </div>
          </div>

          <div className="col-span-1 flex flex-col">
            <label className="text-[9px] text-gray-400 block mb-0.5 font-bold">A/C TYPE</label>
            {acTypeSelect === 'CUSTOM' ? (
              <div className="flex w-full h-8 bg-white border rounded overflow-hidden">
                <input 
                  type="text" 
                  placeholder="기종" 
                  value={acTypeCustom} 
                  onChange={e => setAcTypeCustom(e.target.value.toUpperCase())} 
                  className="w-full px-1 outline-none text-[10px] font-bold text-center" 
                />
                <button type="button" onClick={() => setAcTypeSelect('')} className="bg-gray-200 px-1.5 text-[9px] font-bold hover:bg-red-200">X</button>
              </div>
            ) : (
              <select 
                value={acTypeSelect} 
                onChange={handleAcTypeChange} 
                className="w-full border px-0.5 rounded text-center text-[10px] bg-white font-bold text-blue-900 h-8 cursor-pointer"
              >
                <option value="">선택</option>
                {acTypeOptions[airline].map(opt => (
                  <option key={opt.label} value={opt.label}>{opt.label}</option>
                ))}
                <option value="CUSTOM">직접 입력</option>
              </select>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1.5 text-left">
          <div className="col-span-1 flex flex-col">
            <div className="flex justify-start items-center mb-0.5 h-[14px]">
              <span className="text-[8.5px] text-gray-400 font-bold whitespace-nowrap tracking-tight flex items-center">
                {lblS} <span className="font-normal text-[7px] tracking-tighter">(hhmm)</span>
                <InfoBtn code="STD" />
              </span>
            </div>
            <input 
              type="text" 
              inputMode="numeric" 
              maxLength={4} 
              placeholder="0000" 
              value={std} 
              onChange={e => handleFlightTimeInput(e.target.value, setStd)} 
              className="w-full border rounded text-center font-mono text-[11px] bg-white h-8 px-0" 
            />
          </div>
          
          <div className="col-span-1 flex flex-col">
            <div className="flex justify-between items-center mb-0.5 h-[14px] overflow-visible">
              <span className="text-[8px] text-gray-400 font-bold whitespace-nowrap flex items-center">
                {lblE}<span className="font-normal text-[7px] ml-0.5">(hhmm)</span>
                <InfoBtn code="ETD" />
              </span>
              <label className="text-[6.5px] text-blue-600 font-bold flex items-center cursor-pointer whitespace-nowrap">
                <input type="checkbox" checked={etdNextDay} onChange={e => setEtdNextDay(e.target.checked)} className="w-2 h-2 mr-0.5" />(+1익일)
              </label>
            </div>
            <input 
              type="text" 
              inputMode="numeric" 
              maxLength={4} 
              placeholder="0000" 
              value={etd} 
              onChange={e => handleFlightTimeInput(e.target.value, setEtd, setEtdNextDay)} 
              className="w-full border rounded text-center font-mono text-[11px] bg-white h-8 px-0" 
            />
          </div>
          
          <div className="col-span-1 flex flex-col">
            <div className="flex justify-between items-center mb-0.5 h-[14px] overflow-visible">
              <span className="text-[8px] text-gray-400 font-bold whitespace-nowrap flex items-center">
                {lblA}<span className="font-normal text-[7px] ml-0.5">(hhmm)</span>
                <InfoBtn code="ATD" />
              </span>
              <label className="text-[6.5px] text-blue-600 font-bold flex items-center cursor-pointer whitespace-nowrap">
                <input type="checkbox" checked={atdNextDay} onChange={e => setAtdNextDay(e.target.checked)} className="w-2 h-2 mr-0.5" />(+1익일)
              </label>
            </div>
            <input 
              type="text" 
              inputMode="numeric" 
              maxLength={4} 
              placeholder="0000" 
              value={atd} 
              onChange={e => handleFlightTimeInput(e.target.value, setAtd, setAtdNextDay)} 
              className="w-full border rounded text-center font-mono text-[11px] bg-yellow-50 h-8 px-0" 
            />
          </div>

          <div className="col-span-1 flex flex-col">
            <div className="flex justify-center items-center mb-0.5 h-[14px]">
              <span className="text-[9px] text-gray-400 font-bold flex items-center">
                SPOT <InfoBtn code="SPOT" />
              </span>
            </div>
            <input 
              type="text" 
              placeholder="208" 
              value={spot} 
              onChange={e => setSpot(e.target.value.toUpperCase())} 
              className="w-full border rounded text-center text-[11px] bg-white h-8 px-0 uppercase" 
            />
          </div>
        </div>
      </header>

      <main className="p-2 space-y-2">
        
        <section className="bg-white p-2.5 rounded-lg shadow-sm">
          <span className="text-[11px] font-bold text-gray-600 block mb-1.5">PAX STATUS (승객 현황)</span>
          <div className="grid grid-cols-4 gap-1.5">
            <div className="flex flex-col">
              <span className="text-[9px] text-gray-400 font-bold truncate flex items-center justify-between mb-0.5">
                CFG <InfoBtn code="CFG" />
              </span>
              <input 
                type="text" 
                value={cfg} 
                onChange={(e) => setCfg(e.target.value.replace(/[^0-9]/g, ''))} 
                className="w-full border p-1 rounded text-center bg-white font-bold text-blue-900 text-xs h-7" 
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-gray-400 font-bold truncate flex items-center justify-between mb-0.5">
                BKG <InfoBtn code="BKG" />
              </span>
              <input 
                type="text" 
                inputMode="numeric" 
                placeholder="예: 180" 
                value={isFerry ? '0' : bkg} 
                onChange={e => { if (!isFerry) setBkg(e.target.value); }} 
                className={`w-full border p-1 rounded text-center text-xs h-7 placeholder-gray-300 ${isFerry ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`} 
                readOnly={isFerry}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-gray-400 font-bold truncate flex items-center justify-between mb-0.5">
                OBD <InfoBtn code="OBD" />
              </span>
              <input 
                type="text" 
                inputMode="numeric" 
                placeholder="예: 180" 
                value={isFerry ? '0' : obd} 
                onChange={e => { if (!isFerry) setObd(e.target.value); }} 
                className={`w-full border p-1 rounded text-center text-xs h-7 font-bold ${isObdExceedsCfg ? 'bg-red-50 text-red-600 border-red-400' : isFerry ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'text-slate-800'}`} 
                readOnly={isFerry}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-blue-600 font-bold truncate flex items-center justify-between mb-0.5">
                INF <InfoBtn code="INF" />
              </span>
              <input 
                type="text" 
                inputMode="numeric" 
                placeholder="INF" 
                value={isFerry ? '0' : inf} 
                onChange={e => { if (!isFerry) setInf(e.target.value.replace(/[^0-9]/g, '')); }} 
                className={`w-full border p-1 rounded text-center text-xs h-7 placeholder-gray-300 font-bold ${isFerry ? 'bg-gray-100 text-blue-300 cursor-not-allowed border-gray-200' : 'text-blue-700 bg-blue-50/50'}`} 
                readOnly={isFerry}
              />
            </div>
            {isObdExceedsCfg && (
              <div className="col-span-4 mt-1 text-[10px] text-red-600 font-bold bg-red-50 p-1.5 rounded border border-red-200">
                ⚠️ 탑승객(OBD)이 가용좌석(CFG)을 초과했습니다. 다시 확인해 주세요.
              </div>
            )}
          </div>
        </section>

        {reportMode === 'FDR' && (
          <section className="bg-white p-2.5 rounded-lg shadow-sm space-y-2 border border-red-100">
            <div>
              <label className="text-[11px] font-bold text-gray-600 block mb-0.5">
                지연 요약 (메일 제목용) <span className="font-normal text-[9px] text-gray-500">(직접 수정 가능)</span>
              </label>
              <div className="flex flex-col gap-1">
                <select 
                  value={dlaPreset} 
                  onChange={e => {
                    const val = e.target.value;
                    setDlaPreset(val);
                    if (val !== '직접 입력') {
                      setDlaSummary(val);
                      setDlaReason(val);
                    } else {
                      setDlaSummary(' 인한 출발 지연');
                      setDlaReason(' 인한 출발 지연');
                    }
                  }} 
                  className="w-full border p-1.5 rounded text-xs font-bold text-red-900 bg-red-50 cursor-pointer outline-none"
                >
                  <option value="항공기 연결 관계로 인한 출발 지연">항공기 연결 관계로 인한 출발 지연</option>
                  <option value="도착지 기상 관계로 인한 출발 지연">도착지 기상 관계로 인한 출발 지연</option>
                  <option value="출발지 기상 관계로 인한 출발 지연">출발지 기상 관계로 인한 출발 지연</option>
                  <option value="ATC HOLD로 인한 출발 지연">ATC HOLD로 인한 출발 지연</option>
                  <option value="항공기 정비로 인한 출발 지연">항공기 정비로 인한 출발 지연</option>
                  <option value="승객 자발적 하기로 인한 출발 지연">승객 자발적 하기로 인한 출발 지연</option>
                  <option value="승객 비자발적 하기로 인한 출발 지연">승객 비자발적 하기로 인한 출발 지연</option>
                  <option value="직접 입력">직접 입력</option>
                </select>
                <input 
                  type="text" 
                  value={dlaSummary} 
                  onChange={e => { 
                    setDlaSummary(e.target.value); 
                    setDlaPreset('직접 입력'); 
                    setDlaReason(e.target.value);
                  }} 
                  placeholder="지연 요약 직접 입력"
                  className="w-full border p-1.5 rounded text-xs font-bold text-red-900 bg-white" 
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-600 block mb-0.5">DLA TIME (지연 시간)</label>
              <div className="w-full border p-1.5 rounded text-xs font-bold bg-gray-50 flex justify-between items-center shadow-inner h-8">
                <span className="text-gray-500 text-[10px]">⏱️ {lblS} / {lblA} 입력 시 자동 계산</span>
                <span className="text-red-600">
                  {std.length === 4 && atd.length === 4 ? getDlaTimeStr() || '시간 확인 요망' : ''}
                </span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-600 mb-0.5 flex items-center">
                DLA SET NOTICE 통보 <InfoBtn code="DLA_NOTICE" />
              </label>
              <div className="flex gap-1.5">
                <select 
                  value={dlaNoticeSource} 
                  onChange={e => setDlaNoticeSource(e.target.value)} 
                  className={`border p-1.5 rounded text-xs bg-white font-semibold cursor-pointer ${dlaNoticeSource === 'NIL' ? 'w-full' : 'w-1/2'}`}
                >
                  <option value="NIL">미 입력 시 NIL</option>
                  <option value={`BY ${airline} 운항통제`}>BY {airline} 운항통제</option>
                  <option value="BY ICNKK">BY ICNKK</option>
                </select>
                {dlaNoticeSource !== 'NIL' && (
                  <input 
                    type="text" 
                    inputMode="numeric" 
                    maxLength={4} 
                    placeholder="시간 (HHMM)" 
                    value={dlaNoticeTime} 
                    onChange={e => handleFlightTimeInput(e.target.value, setDlaNoticeTime)} 
                    className="w-1/2 border p-1.5 rounded text-center font-mono text-xs" 
                  />
                )}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-600 block mb-0.5">
                지연 사유 (상세) <span className="font-normal text-[9px] text-gray-500">(직접 수정 가능)</span>
              </label>
              <textarea 
                rows={2} 
                value={dlaReason} 
                onChange={e => { setDlaReason(e.target.value); setDlaPreset('직접 입력'); }} 
                placeholder="상세 지연 사유를 입력하세요"
                className="w-full border p-1.5 rounded text-xs" 
              />
            </div>
          </section>
        )}

        {reportMode === 'FHR' && (
          <section className="bg-white p-2.5 rounded-lg shadow-sm space-y-2 border border-blue-100">
            <div className="space-y-1 pb-1.5 border-b">
              <label className="font-bold text-blue-700 text-xs block">
                FHR 보고 유형 선택 <span className="font-normal text-[9px] text-gray-500">(직접 수정 가능)</span>
              </label>
              <select value={fhrType} onChange={handleFhrTypeChange} className="w-full border p-2 rounded font-bold bg-blue-50 text-blue-900 text-xs cursor-pointer">
                <option value="FERRY OUT">FERRY OUT</option>
                <option value="FERRY IN">FERRY IN</option>
                <option value="자발적 하기">자발적 하기 (OFLD)</option>
                <option value="비자발적 하기">비자발적 하기 (OFLD)</option>
                <option value="RAMP RETURN">RAMP RETURN</option>
                <option value="DIVERT">DIVERT (회항)</option>
                <option value="결항">CNXL (결항)</option>
                <option value="BUS HNDL">BUS HNDL (심야버스)</option>
                <option value="기타(직접 입력)">기타 (직접 입력)</option>
              </select>

              {(fhrType === 'FERRY OUT' || fhrType === 'FERRY IN') && (
                <div className="mt-2 p-2 border border-blue-200 rounded-lg bg-white flex flex-col gap-1.5 shadow-sm">
                  <span className="text-[10px] font-extrabold text-blue-800">운항 성격 선택 (EDI 필수 여부 반영)</span>
                  <div className="flex gap-3">
                    <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1 cursor-pointer">
                      <input type="radio" value="국제선" checked={ferryType === '국제선'} onChange={e => setFerryType(e.target.value)} className="accent-blue-600" /> 국제선
                    </label>
                    <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1 cursor-pointer">
                      <input type="radio" value="국제선(중정비)" checked={ferryType === '국제선(중정비)'} onChange={e => setFerryType(e.target.value)} className="accent-blue-600" /> 국제선(중정비)
                    </label>
                    <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1 cursor-pointer">
                      <input type="radio" value="국내선" checked={ferryType === '국내선'} onChange={e => setFerryType(e.target.value)} className="accent-blue-600" /> 국내선
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-600 block mb-0.5">
                보고 요약 (메일 제목용) <span className="font-normal text-[9px] text-gray-500">(직접 수정 가능)</span>
              </label>
              <input type="text" value={fhrSubjectSummary} onChange={e => setFhrSubjectSummary(e.target.value)} className="w-full border p-1.5 rounded text-xs font-bold text-blue-900 bg-blue-50" />
            </div>

            {(fhrType === '자발적 하기' || fhrType === '비자발적 하기') && (
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-gray-600 block mb-0.5">해당 승객 이름</label>
                  <input type="text" value={fhrPaxNm} onChange={e => setFhrPaxNm(e.target.value)} placeholder="HONG / GILDONG" className="w-full border p-1.5 rounded text-xs placeholder-gray-400" />
                </div>
                <div className="col-span-1">
                  <label className="text-[11px] font-bold text-gray-600 block mb-0.5">인원(TCP)</label>
                  <input 
                    type="number" 
                    min="1"
                    value={fhrPaxCount} 
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '' || parseInt(val, 10) >= 1) {
                        setFhrPaxCount(val);
                      } else {
                        setFhrPaxCount('1');
                      }
                    }} 
                    placeholder="승객 포함 일행 수" 
                    className="w-full border p-1.5 rounded text-xs placeholder-gray-400 font-bold text-center" 
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-gray-600 block mb-0.5">
                사유 경위 (상세) <span className="font-normal text-[9px] text-gray-500">(직접 수정 가능)</span>
              </label>
              <textarea rows={2} value={fhrRzn} onChange={e => setFhrRzn(e.target.value)} className="w-full border p-1.5 rounded text-xs" />
            </div>

            {(fhrType === '자발적 하기' || fhrType === '비자발적 하기' || fhrType === 'BUS HNDL') && (
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-0.5">ACTN TAKEN (조치 사항)</label>
                <textarea rows={4} value={fhrActn} onChange={e => setFhrActn(e.target.value)} className="w-full border p-1.5 rounded text-xs" />
              </div>
            )}
          </section>
        )}

        <section className={`bg-white p-2.5 rounded-lg shadow-sm space-y-2 border ${reportMode === 'FDR' ? 'border-red-100' : 'border-blue-100'}`}>
          <div className="flex justify-between items-center mb-0.5">
            <label className="text-[11px] font-bold text-gray-600">PAX H/D STS (타임라인)</label>
            <button type="button" onClick={handleAddTimeline} className="text-[9px] font-bold bg-gray-200 text-gray-700 px-2 py-1 rounded shadow-sm cursor-pointer">+ 최하단 추가</button>
          </div>
          
          <div className="text-[9px] text-red-600 font-bold mb-1.5 bg-red-50 p-1.5 rounded border border-red-200 leading-snug">
            <p>⚠️ 시간 <strong>2400</strong> 입력 시 자동 익일 변환</p>
            <p>⚠️ 출국업무일지와 동일하게 기록</p>
            <p className="font-normal text-gray-500">(≡ 아이콘을 꾹 눌러 위아래로 끌어 순서 변경)</p>
          </div>

          <div className="space-y-1">
            {timeline.map((t, idx) => (
              <div 
                key={t.id} 
                data-index={idx}
                className={`flex items-center gap-1 bg-gray-50 p-1 rounded border shadow-sm transition-all ${dragOverIdx === idx ? 'border-blue-500 bg-blue-50 scale-[1.01]' : 'border-gray-200'}`}
              >
                <div 
                  className={`flex flex-col items-center justify-center px-1 cursor-grab shrink-0 touch-none transition-transform ${draggedIdx === idx ? 'text-blue-600 scale-125' : 'text-gray-400 hover:text-gray-600'}`}
                  draggable
                  onDragStart={(e) => {
                    setDraggedIdx(idx);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragEnter={() => setDragOverIdx(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnd={() => { 
                    if (draggedIdx !== null && dragOverIdx !== null && draggedIdx !== dragOverIdx) {
                      setTimeline(prev => {
                        const newTimeline = [...prev];
                        const item = newTimeline.splice(draggedIdx, 1)[0];
                        newTimeline.splice(dragOverIdx, 0, item);
                        return newTimeline;
                      });
                    }
                    setDraggedIdx(null); 
                    setDragOverIdx(null); 
                  }}
                  onDrop={() => {
                    if (draggedIdx === null || dragOverIdx === null) return;
                    if (draggedIdx !== dragOverIdx) {
                      setTimeline(prev => {
                        const newTimeline = [...prev];
                        const item = newTimeline.splice(draggedIdx, 1)[0];
                        newTimeline.splice(dragOverIdx, 0, item);
                        return newTimeline;
                      });
                    }
                    setDraggedIdx(null);
                    setDragOverIdx(null);
                  }}
                  onTouchStart={() => {
                    touchTimer.current = setTimeout(() => {
                      isDraggingRef.current = true;
                      setDraggedIdx(idx);
                      if (navigator.vibrate) navigator.vibrate(50);
                    }, 400); 
                  }}
                  onTouchMove={(e) => {
                    if (!isDraggingRef.current) {
                      if (touchTimer.current) clearTimeout(touchTimer.current);
                      return;
                    }
                    const touch = e.touches[0];
                    const element = document.elementFromPoint(touch.clientX, touch.clientY);
                    const indexStr = element?.closest('[data-index]')?.getAttribute('data-index');
                    if (indexStr) {
                      setDragOverIdx(parseInt(indexStr, 10));
                    }
                  }}
                  onTouchEnd={() => {
                    if (touchTimer.current) clearTimeout(touchTimer.current);
                    if (isDraggingRef.current && draggedIdx !== null && dragOverIdx !== null && draggedIdx !== draggedIdx) {
                      setTimeline(prev => {
                        const newTimeline = [...prev];
                        const item = newTimeline.splice(draggedIdx, 1)[0];
                        newTimeline.splice(dragOverIdx, 0, item);
                        return newTimeline;
                      });
                    }
                    isDraggingRef.current = false;
                    setDraggedIdx(null);
                    setDragOverIdx(null);
                  }}
                  onTouchCancel={() => {
                    if (touchTimer.current) clearTimeout(touchTimer.current);
                    isDraggingRef.current = false;
                    setDraggedIdx(null);
                    setDragOverIdx(null);
                  }}
                >
                  <span className="text-[14px] leading-none" title="꾹 눌러서 이동">≡</span>
                </div>
                
                <input 
                  type="text" 
                  maxLength={4} 
                  placeholder="시간" 
                  value={t.time} 
                  onChange={(e) => handleTimelineChange(t.id, 'time', e.target.value)} 
                  className={`w-[40px] border p-1 rounded text-center font-mono text-[11px] h-7 ${reportMode === 'FDR' ? 'bg-red-50' : 'bg-blue-50'} placeholder-gray-400 outline-none shrink-0`} 
                />

                <label className="text-[8px] text-blue-600 font-bold flex items-center whitespace-nowrap cursor-pointer px-0.5 shrink-0">
                  <input 
                    type="checkbox" 
                    checked={t.nextDay || false} 
                    onChange={e => handleTimelineChange(t.id, 'nextDay', e.target.checked)} 
                    className="w-2.5 h-2.5 mr-0.5" 
                  />(+1)
                </label>

                <span className="text-gray-400 font-bold shrink-0">:</span>

                <input 
                  type="text" 
                  value={t.content} 
                  placeholder="내용 입력"
                  onChange={(e) => handleTimelineChange(t.id, 'content', e.target.value)} 
                  className="flex-1 min-w-[50px] border p-1 rounded text-[11px] h-7 outline-none" 
                />

                <button type="button" onClick={() => insertTimelineItem(idx)} className="text-blue-500 font-extrabold px-1 text-sm leading-none cursor-pointer shrink-0" title="아래에 추가">+</button>
                <button type="button" onClick={() => handleRemoveTimeline(t.id)} className="text-red-500 font-bold px-1 text-lg leading-none cursor-pointer shrink-0" title="삭제">&times;</button>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white p-2.5 rounded-lg shadow-sm space-y-3">
          <div>
            <label className="text-[11px] font-bold text-gray-600 block mb-0.5">OTHER SPCL</label>
            <textarea rows={2} placeholder="특이사항 한줄씩 입력 / 미 입력 시 NIL" value={othrSpcl} onChange={e => setOthrSpcl(e.target.value)} className="w-full border p-1.5 rounded text-xs placeholder-gray-400" />
          </div>

          <div className="border-t pt-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] font-bold text-gray-700 flex items-center">
                H/D TIME <span className="font-medium text-[9px]">(직원 실제 업무 시간)</span>
                <InfoBtn code="HD_TIME" />
              </span>
              <button type="button" onClick={handleAddHdStaff} className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded shadow cursor-pointer">+ 추가</button>
            </div>
            
            {timeAlertMsg && (
              <div className="text-[10px] text-red-600 font-bold bg-red-50 p-1.5 rounded border border-red-200 mt-1 animate-pulse">
                {timeAlertMsg}
              </div>
            )}
            
            <p className="text-[9px] text-gray-500 font-medium mt-1 mb-1">
              ※ 출국업무일지에 기재되는 실제 업무 시작/종료 시간과 일치해야 합니다.
            </p>

            <div className="space-y-1">
              {hdTimes.map(h => {
                const durStr = calculateDuration(h.start, h.end, h.endNextDay);
                return (
                  <div key={h.id} className="flex flex-col gap-0.5 border p-1 rounded bg-white shadow-sm">
                    <div className="flex gap-1 items-center">
                      <input 
                        type="text" 
                        placeholder={h.typeLabel} 
                        value={h.name} 
                        onChange={e => handleNameChange(h.id, e.target.value)} 
                        className="w-[74px] border p-1 rounded text-center text-xs bg-blue-50 h-7 shrink-0" 
                      />
                      <input 
                        type="text" 
                        inputMode="numeric" 
                        maxLength={4} 
                        placeholder={reportMode === 'FDR' ? "S/U시간" : "시작시간"} 
                        value={h.start} 
                        onChange={e => handleHdTimeChange(h.id, 'start', e.target.value)} 
                        className="flex-1 min-w-[50px] border p-1 rounded text-center font-mono text-xs bg-blue-50 h-7 placeholder-gray-400" 
                      />
                      <span className="text-gray-400 text-[10px] shrink-0">~</span>
                      <input 
                        type="text" 
                        inputMode="numeric" 
                        maxLength={4} 
                        placeholder="종료시간" 
                        value={h.end} 
                        onChange={e => handleHdTimeChange(h.id, 'end', e.target.value)} 
                        className="flex-1 min-w-[50px] border p-1 rounded text-center font-mono text-xs bg-blue-50 h-7 placeholder-gray-400" 
                      />
                      <label className="text-[9px] text-blue-600 font-bold flex items-center px-0.5 whitespace-nowrap cursor-pointer shrink-0">
                        <input 
                          type="checkbox" 
                          checked={h.endNextDay} 
                          onChange={e => handleCheckboxChange(h.id, e.target.checked)} 
                          className="w-3 h-3 mr-0.5" 
                        />(+1익일)
                      </label>
                      <button type="button" onClick={() => handleRemoveHdStaff(h.id)} className="text-red-500 font-bold px-1 text-sm leading-none cursor-pointer shrink-0">&times;</button>
                    </div>
                    {durStr && (
                      <div className="text-[9px] text-blue-600 font-bold text-right pr-6 mt-0.5">
                        H/D TIME {durStr}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border border-blue-200 p-2 rounded-lg space-y-1.5 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-blue-900 flex items-center">
                ADD MAN TIME <span className="text-[9px] text-red-500 font-normal">(자정 넘기면 (+1익일) 체크)</span>
                <InfoBtn code="ADD_MAN" />
              </span>
              <button type="button" onClick={handleAddStaff} className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded shadow cursor-pointer">+ 추가</button>
            </div>
            
            {timeAlertMsg && (
              <div className="text-[10px] text-red-600 font-bold bg-red-50 p-1.5 rounded border border-red-200 mt-1 animate-pulse">
                {timeAlertMsg}
              </div>
            )}

            {isEdiRequired() ? (
              <p className="text-[9px] text-red-600 font-bold bg-red-50 p-1 rounded border border-red-200">
                🚨 {reportMode === 'FDR' ? 'FDR 보고는 EDI(오피스) 직원의 출항보고 입력이 필수입니다.' : '국제선 FERRY 편(OUT/IN)은 EDI(오피스) 직원의 출/입항보고 입력이 필수입니다.'}
              </p>
            ) : (
              <p className="text-[9px] text-gray-500 font-medium">
                ※ EDI(오피스) 직원은 FDR 전체 또는 FHR 국제선 FERRY 편 발생 시 필수 입력입니다.
              </p>
            )}
            
            <p className="text-[9px] text-gray-500 font-medium leading-relaxed">
              ※ 이름 란에 'EDI'나 '오피스'라고 적지 말고 <strong className="text-red-500">실제 근무한 직원 실명</strong>을 적어주세요.<br/>
              ※ SPVR는 <strong className="text-blue-600">GATE MAIN 직원</strong>만 적용 됩니다.
            </p>

            <div className="space-y-1">
              {addManList.map(s => {
                const durStr = calculateDuration(s.start, s.end, s.endNextDay);
                return (
                  <div key={s.id} className="flex flex-col gap-0.5 bg-white p-1 rounded border shadow-none">
                    <div className="flex gap-1 items-center">
                      <select 
                        value={s.role} 
                        onChange={e => handleRoleChange(s.id, e.target.value)} 
                        className={`border p-0.5 rounded text-[11px] font-bold w-[60px] h-7 bg-white cursor-pointer shrink-0 ${s.role === 'EDI' ? 'text-red-600' : 'text-blue-900'}`}
                      >
                        <option value="SPVR" className="text-blue-900">SPVR</option>
                        <option value="AGNT" className="text-blue-900">AGNT</option>
                        <option value="EDI" className="text-red-600 font-bold">EDI</option>
                      </select>
                      <input 
                        type="text" 
                        placeholder={s.role === 'EDI' ? "직원 실명(필수)" : "이름"} 
                        value={s.name} 
                        onChange={e => handleNameChange(s.id, e.target.value)} 
                        className="w-[66px] border p-1 rounded text-center text-xs h-7 shrink-0" 
                      />
                      <input 
                        type="text" 
                        inputMode="numeric" 
                        maxLength={4} 
                        placeholder={reportMode === 'FDR' ? "S/U시간" : "시작시간"} 
                        value={s.start} 
                        onChange={e => handleAddManTimeChange(s.id, 'start', e.target.value)} 
                        className="flex-1 min-w-[50px] border p-1 rounded text-center font-mono text-xs h-7 placeholder-gray-400" 
                      />
                      <span className="text-gray-400 text-[10px] shrink-0">~</span>
                      <input 
                        type="text" 
                        inputMode="numeric" 
                        maxLength={4} 
                        placeholder="종료시간" 
                        value={s.end} 
                        onChange={e => handleAddManTimeChange(s.id, 'end', e.target.value)} 
                        className="flex-1 min-w-[50px] border p-1 rounded text-center font-mono text-xs h-7 placeholder-gray-400" 
                      />
                      <label className="text-[9px] text-blue-600 font-bold flex items-center px-0.5 whitespace-nowrap cursor-pointer shrink-0">
                        <input 
                          type="checkbox" 
                          checked={s.endNextDay} 
                          onChange={e => handleCheckboxChange(s.id, e.target.checked)} 
                          className="w-3 h-3 mr-0.5" 
                        />(+1익일)
                      </label>
                      <button type="button" onClick={() => handleRemoveStaff(s.id)} className="text-red-500 font-bold px-1 text-sm leading-none cursor-pointer shrink-0">&times;</button>
                    </div>
                    {durStr && (
                      <div className="text-[9px] text-blue-600 font-bold text-right pr-6 mt-0.5">
                        ADD MAN TIME {durStr}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t pt-2 space-y-1.5">
            <span className="text-[11px] font-bold text-gray-700 block">작성자 정보</span>
            <div className="space-y-1.5">
              <div>
                <input 
                  type="text" 
                  placeholder="LAST NAME(성) FIRST NAME(이름)" 
                  value={writerName} 
                  onChange={e => setWriterName(e.target.value)} 
                  className={`w-full border p-1.5 rounded text-xs uppercase font-bold bg-white ${hasKoreanName ? 'border-red-400 bg-red-50' : ''}`} 
                />
                {hasKoreanName && (
                  <span className="text-[9px] text-red-600 font-bold block mt-0.5">※ 가급적 영문 입력을 권장합니다.</span>
                )}
              </div>
              <div>
                <input 
                  type="text" 
                  inputMode="numeric" 
                  maxLength={13} 
                  placeholder="전화번호 (숫자만 입력)" 
                  value={writerPhone} 
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    let formatted = val;
                    if (val.length > 3 && val.length <= 7) formatted = `${val.slice(0, 3)}-${val.slice(3)}`;
                    else if (val.length > 7) formatted = `${val.slice(0, 3)}-${val.slice(3, 7)}-${val.slice(7, 11)}`;
                    setWriterPhone(formatted);
                  }} 
                  className="w-full border p-1.5 rounded text-xs font-bold" 
                />
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col items-center gap-1.5 mt-2 py-2">
          <div className="text-center text-[10px] text-gray-400 font-mono">
            CREATED BY SH.CHO (Ver 1.0)
          </div>
          <button
            type="button"
            onClick={() => window.open('mailto:shcho1219@airkorea.biz?subject=[스마트 리포트 툴] 오류 제보 및 건의사항')}
            className="text-[10px] text-gray-500 underline hover:text-gray-700 cursor-pointer"
          >
            💡 시스템 오류 제보 및 건의사항 남기기
          </button>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-2.5 bg-white border-t z-20 shadow-md max-w-md mx-auto flex gap-2">
        <button 
          type="button" 
          onClick={() => saveToLocalStorage(true)} 
          className="w-1/3 bg-gray-500 text-white py-3 rounded-lg font-bold text-xs shadow active:bg-gray-400 transition cursor-pointer flex justify-center items-center gap-1"
        >
          <span>💾 임시저장</span>
        </button>
        <button 
          type="button" 
          onClick={handleOpenPreview} 
          className="w-2/3 bg-slate-900 text-white py-3 rounded-lg font-bold text-xs shadow active:bg-slate-700 transition cursor-pointer"
        >
          메일 양식 확인 및 복사하기 📋
        </button>
      </footer>

      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-2.5">
          <div className="bg-white rounded-xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="bg-slate-900 text-white p-2.5 flex justify-between items-center">
              <span className="font-bold text-xs">📩 메일 본문 복사하기</span>
              <button type="button" onClick={() => setShowPreviewModal(false)} className="text-xl leading-none cursor-pointer">&times;</button>
            </div>

            <div className="bg-red-600 text-white p-3.5 text-[16px] font-extrabold leading-snug flex flex-col gap-1.5">
              <span>⚠️ [직원 필독 사고 방지]</span>
              <span className="text-[14px] font-medium leading-relaxed">
                아래 내용(수신처 포함)을 전체 복사하여 메일 본문에 붙여넣은 뒤, <b>수신처/제목 부분만 메일 설정에 맞게 잘라내기</b> 하세요!
              </span>
            </div>

            {missingFields.length > 0 && (
              <div className="p-2 bg-red-50 border-b border-red-200">
                <span className="text-red-700 font-bold text-[10px] block mb-1">🚨 확인 필요한 누락 항목:</span>
                <div className="flex flex-wrap gap-1">
                  {missingFields.map(f => (
                    <span key={f} className="bg-red-100 text-red-800 text-[9px] px-1.5 py-0.5 rounded font-semibold border border-red-200">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="p-2.5 overflow-y-auto flex-1 bg-gray-50 text-[11px]">
              <pre className="whitespace-pre-wrap font-mono text-slate-800 bg-white p-2 rounded border leading-relaxed select-all">
                {previewText.split(/(LJ---|RS---|BX---|----L|시간L|이름입력필요|번호입력필요|미입력|XXX|---)/g).map((part, i) => {
                  if (['LJ---', 'RS---', 'BX---', '----L', '시간L', '이름입력필요', '번호입력필요', '미입력', 'XXX', '---'].includes(part)) {
                    return <span key={i} className="text-red-600 font-extrabold bg-red-50 rounded px-0.5">{part}</span>;
                  }
                  return part;
                })}
              </pre>
            </div>

            <div className="p-3 border-t bg-white flex flex-col gap-2">
              <button 
                type="button" 
                onClick={() => setShowPreviewModal(false)} 
                className="w-full py-3 rounded-lg font-bold bg-slate-800 text-white text-[13px] shadow-md active:scale-95 transition cursor-pointer flex justify-center items-center gap-2"
              >
                <span>⬅️ 계속 수정하기 (돌아가기)</span>
              </button>
              
              <button 
                type="button" 
                onClick={(e) => {
                  if (missingFields.length > 0) {
                    const proceed = window.confirm("🚨 누락된 필수 항목이 있습니다.\n\n그래도 이대로 복사하시겠습니까?");
                    if (!proceed) return;
                  }
                  handleFinalCopy();
                }} 
                className={`w-full py-3 rounded-lg font-bold text-[13px] shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  missingFields.length > 0 
                  ? "bg-orange-500 text-white active:scale-95" 
                  : "bg-blue-600 text-white active:scale-95"
                }`}
              >
                <span>✨ [전체 내용] {missingFields.length > 0 ? '강제 복사하기' : '안전하게 복사하기'} 📋</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}