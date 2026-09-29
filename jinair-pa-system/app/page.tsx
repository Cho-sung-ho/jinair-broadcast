'use client';

import React, { useState } from 'react';
import { Play, Mic, MonitorSmartphone, AlertTriangle, Clock, Volume2, UserX, AlertOctagon, ChevronDown, ChevronUp, Settings } from 'lucide-react';

// --- 1. 매뉴얼 데이터베이스 (VER 3.0 전체 100% 반영) ---
const MANUAL_DATA = [
  {
    id: 'sec-1',
    icon: <MonitorSmartphone size={16} />,
    title: '1. GATE 보조배터리 안내',
    items: [
      {
        subId: '1-1',
        title: '1-1. GATE 보조배터리 안내(국문, 영문)',
        blocks: [
          { type: 'AI', lang: '국문', text: '진에어에서 안내 말씀드리겠습니다. \n항공기 탑승 후 보조배터리와 전자담배의 사용 및 충전은 금지되며, 또한 기내 선반 보관은 엄격히 금지되어 있습니다. \n보조배터리는 160Wh 이하 최대 2개까지 반입 가능하며, 160Wh 초과 시 반입이 불가합니다. 반드시 직접 휴대하시거나 좌석 앞 주머니에 보관해주시고, 단락 방지를 위해 절연테이프를 부착해주시기 바랍니다. 감사합니다.', link: '' },
          { type: 'AI', lang: '영문', text: 'May I have your attention please. \nAfter boarding, the use and charging of portable batteries and electronic cigarettes are strictly prohibited. In addition, storing portable batteries in the overhead bins is strictly prohibited. \nEach passenger may carry up to two portable batteries under 160Wh. Portable batteries exceeding 160Wh are not allowed onboard. \nPlease keep portable batteries with you at all times or place them in the seat pocket in front of you. To prevent short circuits, please apply insulating tape to the terminals. Thank you for your cooperation.', link: '' }
        ]
      },
      {
        subId: '1-2',
        title: '1-2. GATE 보조배터리 안내(일문, 중문)',
        blocks: [
          { type: 'AI', lang: '일문', text: 'ジンエアーよりご案内申し上げます。 \nご搭乗後、モバイルバッテリーおよび電子タバコの使用や充電などは禁止されておりま す。 また、座席上の物入れに保管することは厳しく禁止されております。 \nモバイルバッテリーはおひとり様2個まで、160Wh以下のものに限り、機内持ち込み可能 でございます。 160Whを超えるものは機内持ち込みいただけません。 \nモバイルバッテリーはお手元にお持ちになるか、座席前のポケットにお入れください。ま た、ショート防止のため、端子部分をテープで保護、もしくはビニール袋にお入れ、絶縁処 理をお願いいたします。 \nご協力いただき、誠にありがとうございます。', link: '' },
          { type: 'AI', lang: '중문', text: '各位旅客，您好。歡迎搭乘真航空航班。\n登機後，嚴禁使用或充電行動電源及電子菸。此外，嚴禁將行動電源放置於座位上方的置物櫃內。\n每位旅客最多可攜帶兩個一百六十瓦時（160Wh）以下的行動電源登機，超過一百六十瓦時（160Wh）的行動電源禁止攜帶登機。\n請務必將行動電源隨身攜帶，或放置於前方座椅口袋內。\n為避免短路，請使用絕緣膠帶保護電池端子，或放入獨立塑膠袋內做好絕緣處理。\n感謝您的理解與配合。', link: '' }
        ]
      }
    ]
  },
  {
    id: 'sec-2',
    icon: <Mic size={16} />,
    title: '2. GATE B777 탑승 방송',
    items: [
      {
        subId: '2-1',
        title: '2-1. B777 탑승 10분 전 안내 & 탑승순서안내(국문)',
        blocks: [
          { type: 'VOICE', lang: '국문', text: 'Fly Better Fly, 진에어에서 안내말씀 드리겠습니다\n유모차 및 수하물 위탁이 필요한 승객께서는 {{게이트}} 탑승구로 나오셔서 전달해주시기 바랍니다. \n\n<정시 탑승>\n진에어 LJ{{편명}}편 {{목적지}}행은 {{시간}}부터 탑승을 시작할 예정이며(입니다. 감사합니다) 다음과 같이 탑승 순서에 대해 안내드립니다.\n\n<지연 탑승>\n진에어 LJ{{편명}}편 {{목적지}}행은 {{사유}}로 인해 탑승이 지연되어, {{시간}}부터 탑승을 시작할 예정이며(입니다. 감사합니다 - AI음성 사용 시) 다음과 같이 탑승 순서에 대해 안내드립니다.' },
          { type: 'AI', lang: '국문', text: '(진에어에서 탑승 순서 안내 말씀 드리겠습니다)\n탑승 시에는 24개월 미만 유아 동반자, 노약자 및 임산부 등 직원의 도움이 필요한 승객분들께서 먼저 탑승을 하실 수 있도록 도와드리고 있습니다.\n또한 진에어는 원활한 탑승을 위해 Zone Boarding을 실시하고 있습니다.\n탑승권상 A ZONE으로 표시되어있는 JINI PLUS좌석인 1열부터 6열, 그리고 D ZONE으로 표시되어있는 51열부터 63열의 승객께서는 먼저 탑승을 할 예정이오니 탑승권에 표시된 ZONE을 확인하시어 탑승을 준비해주시기 바랍니다.\n다음으로 C ZONE으로 표시되어 있는 37열부터 50열 승객, 이어서 B ZONE으로 표시되어 있는 28열부터 36열 승객 순으로 탑승할 예정이오니 탑승권에 표시된 ZONE을 확인하시어 탑승을 준비 해주시기 바랍니다.\n감사합니다.', link: '' }
        ]
      },
      {
        subId: '2-2',
        title: '2-2. B777 탑승 10분 전 안내 & 탑승순서안내(영,일,중)',
        blocks: [
          { type: 'AI', lang: '영문', text: 'May I have your attention, please. This is an announcement from Jin Air.\nPassengers checking strollers or baggage at the gate, please come to the gate.\nWe will first begin pre-boarding for passengers traveling with infants under 24 months, the elderly, pregnant women, and anyone requiring special assistance.\nAdditionally, for a seamless boarding process, we are boarding by zones.\nPassengers assigned to Zone A, including rows 1 to 6, and passengers assigned to Zone D, including rows 51 to 63 as indicated on the boarding pass, will be invited to board first.\nNext, boarding will proceed in the order of Zone C for rows 37 to 50, followed by Zone B for rows 28 to 36 \nPlease check the zone indicated on your boarding pass and prepare for boarding. Thank you.', link: '' },
          { type: 'AI', lang: '일문', text: 'ジンエアーより、搭乗順についてご案内いたします。\nご搭乗の際は、24ヶ月未満の乳幼児をお連れのお客様、お体の不自由なお客様、ご妊娠中のお客様など、係員のお手伝いが必要なお客様から優先してご案内いたします。\nまた、ジンエアーではスムーズなご搭乗のため、ゾーンボーディングを実施しております。\n搭乗券にZONE A、ジニプラスの1列目から6列目、およびZONE D、51列目から63列目と表示されているお客様から先にご案内いたします。搭乗券に表示されたZONEをご確認のうえ、ご搭乗の準備をお願いいたします。\n続きまして、ZONE Cと表示されている37列目から50列目のお客様、その後ZONE Bと表示されている28列目から36列目のお客様の順にご案内いたします。搭乗券に表示されたZONEをご確認のうえ、ご搭乗の準備をお願いいたします。\nありがとうございます。', link: '' },
          { type: 'AI', lang: '중문', text: '真航空现在为您说明登机顺序。登机时，携带24个月以下婴幼儿的旅客、老年旅客、孕妇，以及需要工作人员协助的旅客将优先登机。此外，为了让登机过程更加顺畅，真航空实行分区登机。\n登机牌上标示为A区、JINI PLUS座位第1排至第6排，以及登机牌上标示为D区、第51排至第63排的旅客将优先登机。请确认登机牌上标示的区域，并做好登机准备。\n接下来，登机将按照登机牌上标示为C区、第37排至第50排，以及B区、第28排至第36排的顺序进行。请确认登机牌上标示的区域，并做好登机准备。谢谢。', link: '' }
        ]
      },
      {
        subId: '2-3',
        title: '2-3. B777 탑승 직전 안내 & A, D ZONE 탑승 안내(국,영)',
        blocks: [
          { type: 'VOICE', lang: '국문', text: 'Fly Better Fly 진에어에서 안내말씀 드리겠습니다.\n{{목적지}}로 출발 예정인 진에어 LJ{{편명}}편은 곧 탑승을 시작하오니, 승객께서는 {{게이트}}번 탑승구로 탑승해 주시기 바랍니다. (감사합니다)\n\n사전에 인천공항 스마트패스 앱으로 탑승권과 안면 정보를 등록하신 승객께서는 ZONE에 관계없이 탑승구의 스마트패스 전용 라인 쪽으로 탑승해주시기 바랍니다.\n등록되지 않은 승객께서는 해당하는 탑승 ZONE의 순서에 탑승을 준비해주시기 바랍니다.\n진에어에서는 직원의 도움이 필요한 24개월 미만 유아 동반자, 노약자 및 임산부 등 먼저 탑승을 하실 수 있도록 도와드리고 있습니다.\n또한 원활한 탑승을 위해 ZONE BOARDING을 실시하고 있습니다.\n탑승권 상 ZONE A로 표시되어있는 1열부터 6열, ZONE D로 표시되어있는 51열부터 63열 승객께서 먼저 탑승해주시고, 이후 ZONE C, ZONE B 순으로 탑승 예정이오니 잠시 대기해주시기 바랍니다. \n탑승 전 여권 사진면과 탑승권을 확인을 하고 있습니다. 정확한 신원확인을 위해 착용하신 마스크, 선글라스, 모자 등 미리 착용을 벗어두시어 신원확인에 적극 협조해주시기 바랍니다. 감사합니다' },
          { type: 'VOICE', lang: '영문', text: 'May I have your attention please.\nJin Air flight LJ{{편명}} bound for {{목적지}}, will start boarding soon. Please get ready at Gate {{게이트}}.\n\n(May I have your attention, please) - <AI 음성 재생>' },
          { type: 'AI', lang: '영문', text: 'Passengers who registered their boarding pass and facial recognition on the Incheon Airport Smartpass app may use the dedicated Smartpass lane regardless of their boarding zone. \nUnregistered passengers, please wait until your designated zone is called. \nJin Air offers pre-boarding for passengers needing assistance, including those traveling with infants under 24 months, elderly passengers, and pregnant passengers. \nTo ensure a smooth process, we are boarding by zones. We are currently boarding Zone A, rows 1 through 6, and Zone D, rows 51 through 63. Passengers in Zones C and B, please remain seated until your zone is called. \nPlease have your passport photo page and boarding pass ready. For identity verification, kindly remove any masks, sunglasses, or hats. Thank you.', link: '' }
        ]
      },
      {
        subId: '2-4',
        title: '2-4. B777 탑승 직전 안내 & A, D ZONE 탑승 안내(일문)',
        blocks: [
          { type: 'VOICE', lang: '일문', text: 'ジンエアーLJ{{편명}}便、{{목적지}}行きは、まもなくご搭乗を開始いたします。ご利用のお客様は、{{게이트}}番搭乗口よりご搭乗ください。' },
          { type: 'AI', lang: '일문', text: '仁川空港スマートパスアプリで搭乗券と顔認証をご登録のお客様は、ゾーンに関わらず専用レーンをご利用いただけます。\nご登録のないお客様は、ご自身の搭乗ゾーンの案内までお待ちください。\nジンエアーでは、24か月未満の幼児をお連れのお客様、ご年配のお客様、妊娠中のお客様など、優先搭乗をご案内しております。\nまた、スムーズなご案内のためゾーンボーディングを実施しております。ただいま搭乗券に Zone Aと記載された1列から6列、Zone Dと記載された51列から63列のお客様よりご案内しております。\nZone C、Zone Bのお客様は、恐れ入りますがそのままお待ちください。\n搭乗口ではパスポートの顔写真ページと搭乗券を確認いたします。スムーズな本人確認のため、マスク、サングラス、帽子などはあらかじめお外しいただきますようご協力をお願いいたします。', link: '' }
        ]
      },
      {
        subId: '2-5',
        title: '2-5. B777 탑승 직전 안내 & A, D ZONE 탑승 안내(중문)',
        blocks: [
          { type: 'VOICE', lang: '중문', text: '飞往{{목적지}}的真航空 LJ{{편명}}航班即将开始登机。请前往{{게이트}}号登机口准备登机。' },
          { type: 'AI', lang: '중문', text: '已通过仁川机场斯玛特通 应用 注册登机牌和面部信息的旅客，无需确认登机区域，请走斯玛特通 应专用通道登机。\n未注册的旅客，请按照您的登机区域顺序准备登机。\n真航空为携带24个月以下婴儿的旅客、年长者及孕妇等需要帮助的旅客提供优先登机服务。同时，为了确保顺利登机，我们正在实施按区域登机。\n请登机牌上显示为Zone A、座位在1排至6排，以及Zone D、座位在51排至63排的旅客优先登机。\nZone C和Zone B的旅客，请您稍作等待。\n登机前我们将核对您的护照照片页和登机牌。为了准确确认身份，请您提前取下口罩、墨镜和帽子，积极配合我们的工作。谢谢。', link: '' }
        ]
      },
      {
        subId: '2-6',
        title: '2-6. B777 C ZONE 탑승 안내',
        blocks: [
          { type: 'AI', lang: '국문', text: '기다려 주셔서 감사합니다.\n탑승권 상 ZONE C로 표시되어있는 37열부터 50열의 승객께서는 지금 탑승해주시기 바라며, ZONE B에 해당하시는 승객께서는 잠시 대기하여주시기 바랍니다.\n탑승 전 여권 사진면과 탑승권을 확인하고 있습니다. 정확한 신원확인을 위해 착용하신 마스크, 선글라스, 모자 등 미리 착용을 벗어두시어 신원확인에 적극 협조해주시기 바랍니다. 감사합니다.', link: '' },
          { type: 'AI', lang: '영문', text: 'Thank you for your patience. Passengers with Zone C on their boarding pass, sitting in rows 37 through 50, may now board. Passengers in Zone B, please remain seated until your zone is called. Please have your passport photo page and boarding pass ready. For identity verification, kindly remove any masks, sunglasses, or hats in advance. Thank you.', link: '' },
          { type: 'AI', lang: '일문', text: '大変お待たせいたしました。ただいま搭乗券に Zone C と記載された37列から50列のお客様をご案内しております。Zone Bのお客様は、恐れ入りますがそのままお待ちください。搭乗口ではパスポートの顔写真ページと搭乗券を確認いたします。スムーズな本人確認のため、マスク、サングラス、帽子などはあらかじめお外しいただきますようご協力をお願いいたします。', link: '' },
          { type: 'AI', lang: '중문', text: '感谢您的耐心中候。请登机牌上显示为 C区、座位在37排至50排的旅客现在登机。B区的旅客，请您稍作等待。登机前我们将核对您的护照照片页和登机牌。为了准确确认身份，请您提前取下口罩、墨镜和帽子，积极配合我们的工作。谢谢。', link: '' }
        ]
      },
      {
        subId: '2-7',
        title: '2-7. B777 모든 승객 탑승 안내',
        blocks: [
          { type: 'VOICE', lang: '국문', text: '진에어 LJ{{편명}}편, {{목적지}}행의 모든 승객께서는 {{게이트}}번으로 탑승해주시기 바랍니다.\n신원확인을 위해 여권 사진면과 탑승권을 함께 준비해주시기 바랍니다.' },
          { type: 'VOICE', lang: '영문', text: 'We now invite all remaining passengers on Jin Air flight LJ{{편명}} bound for {{목적지}} to board at Gate {{게이트}}.\nPlease have your passport open to the photo page and your boarding pass ready.' },
          { type: 'VOICE', lang: '일문', text: 'お待たせいたしました。\nジンエアーLJ{{편명}}便 {{목적지}}行き、すべて お客様 ご搭乗ください。\nご本人確認のため、パスポート 写真ページと搭乗券をご用意ください。 \nありがとうございます。' },
          { type: 'VOICE', lang: '중문', text: '真航空 LJ{{편명}}航班飞往{{목적지}}的所有旅客，请现在前往{{게이트}}号登机口登机。\n为了确认身份，请提前准备好护照照片页以及登机牌。' }
        ]
      }
    ]
  },
  {
    id: 'sec-3',
    icon: <Volume2 size={16} />,
    title: '3. GATE B737 탑승 방송',
    items: [
      {
        subId: '3-1',
        title: '3-1. B737 탑승 10분 전 안내 & 탑승순서안내(국문)',
        blocks: [
          { type: 'VOICE', lang: '국문', text: 'Fly Better Fly, 진에어에서 안내말씀 드리겠습니다.\n유모차 및 수하물 위탁이 필요한 승객께서는 {{게이트}} 탑승구로 나오셔서 전달해주시기 바랍니다. \n\n<정시 탑승>\n진에어 LJ{{편명}}편 {{목적지}}행은 {{시간}}부터 탑승을 시작할 예정이며(입니다)\n다음과 같이 탑승 순서에 대해 안내드립니다.\n\n<지연 탑승>\n진에어 LJ{{편명}}편 {{목적지}}행은 {{사유}}로 인해 탑승이 지연되어, {{시간}}부터 탑승을 시작할 예정이며(입니다. 감사합니다 - AI음성 사용 시) \n다음과 같이 탑승 순서에 대해 안내드립니다.' },
          { type: 'AI', lang: '국문', text: '(진에어에서 탑승 순서 안내 말씀 드리겠습니다) \n탑승 시에는 24개월 미만 유아 동반자, 노약자 및 임산부 등 직원의 도움이 필요한 승객분들께서 먼저 탑승을 하실 수 있도록 도와드리고 있습니다.\n또한 진에어는 원활한 탑승을 위해 Zone Boarding을 실시하고 있습니다.\n탑승권상 C ZONE으로 표시되어있는 47열부터 59열의 승객께서는 먼저 탑승할 예정이오니, 탑승권에 표시된 ZONE을 확인하시어 탑승을 준비 해주시기 바랍니다.\n다음으로 B ZONE으로 표시되어있는 34열부터 46열 승객, 이어서 A ZONE으로 표시되어 있는 28열부터 33열 승객 순으로 탑승할 예정이오니, 탑승권에 표시된 ZONE을 확인하시어 탑승을 준비 해주시기 바랍니다. 감사합니다.', link: '' }
        ]
      },
      {
        subId: '3-2',
        title: '3-2. B737 탑승 10분 전 안내 & 탑승순서안내(영, 일, 중)',
        blocks: [
          { type: 'AI', lang: '영문', text: 'May I have your attention, please.\nThis is an announcement from Jin Air.\nPassengers checking strollers or baggage at the gate, please come to the gate.\nWe will first begin pre-boarding for passengers traveling with infants under 24 months, the elderly, pregnant women, and anyone requiring special assistance.\nAdditionally, for a seamless boarding process, we are boarding by zones.\nPassengers assigned to Zone C, including rows 47 to 59 as indicated on the boarding pass, will be invited to board first.\nNext, boarding will proceed in the order of Zone B for rows 34 to 46, followed by Zone A for rows 28 to 33.\nPlease check the zone indicated on your boarding pass and prepare for boarding. Thank you.', link: '' },
          { type: 'AI', lang: '일문', text: 'ジンエアーより、搭乗順についてご案内いたします。\nご搭乗の際は、24ヶ月未満の乳幼児をお連れのお客様、お体の不自由なお客様、ご妊娠中のお客様など、係員のお手伝いが必要なお客様から優先してご案内いたします。\nまた、ジンエアーではスムーズなご搭乗のため、ゾーンボーディングを実施しております。\n搭乗券に ZONE C と表示されている47列から59列のお客様から先にご案内いたします。搭乗券に表示された ZONE をご確認のうえ、ご搭乗の準備をお願いいたします。\n続きまして、ZONE B と表示されている34列から46列のお客様、その後 ZONE A と表示されている28列から33列のお客様の順にご案内いたします。搭乗券に表示された ZONE をご確認のうえ、ご搭乗の準備をお願いいたします。\nありがとうございます。', link: '' },
          { type: 'AI', lang: '중문', text: '真航空现在为您说明登机顺序。\n登机时，携带24个月以下婴幼儿的旅客、老年旅客、孕妇，以及需要工作人员协助的旅客将优先登机。此外，为了让登机过程更加顺畅，真航空实行分区登机。登机牌上标示为 C区、座位位于第47排至第59排的旅客将优先登机。请确认登机牌上标示的区域，并做好登机准备。接下来，登机将按照登机牌上标示的 B区、第34排至第46排，以及 A区、第28排至第33排的顺序进行。请确认登机牌上标示的区域，并做好登机准备。谢谢。', link: '' }
        ]
      },
      {
        subId: '3-3',
        title: '3-3. B737 탑승 직전 안내 & C ZONE 탑승 안내(국, 영)',
        blocks: [
          { type: 'VOICE', lang: '국문', text: 'Fly Better Fly 진에어에서 안내말씀 드리겠습니다.\n{{목적지}}로 출발 예정인 진에어 LJ{{편명}}편은 곧 탑승을 시작하오니, 승객께서는 {{게이트}}번 탑승구로 탑승해 주시기 바랍니다.\n\n사전에 인천공항 스마트패스 앱으로 탑승권과 안면 정보를 등록하신 승객께서는 ZONE에 관계없이 탑승구의 스마트패스 전용 라인 쪽으로 탑승해주시기 바랍니다.\n등록되지 않은 승객께서는 해당하는 탑승 ZONE의 순서에 탑승을 준비해주시기 바랍니다.\n진에어에서는 직원의 도움이 필요한 24개월 미만 유아 동반자, 노약자 및 임산부 등 먼저 탑승을 하실 수 있도록 도와드리고 있습니다. 또한 원활한 탑승을 위해 ZONE BOARDING을 실시하고 있습니다.\n탑승권 상 ZONE C로 표시되어있는 47열부터 59열 승객께서 먼저 탑승해주시고, 이후 ZONE B, ZONE A 순으로 탑승 예정이오니 잠시 대기해주시기 바랍니다. \n탑승 전 여권 사진면과 탑승권을 확인을 하고 있습니다. 정확한 신원확인을 위해 착용 하신 마스크, 선글라스, 모자 등 미리 착용을 벗어두시어 신원확인에 적극 협조해주시기 바랍니다. 감사합니다.' },
          { type: 'VOICE', lang: '영문', text: 'May I have your attention please.\nJin Air flight LJ{{편명}} bound for {{목적지}}, will start boarding soon. Please get ready at Gate {{게이트}}.' },
          { type: 'AI', lang: '영문', text: 'Passengers who registered their boarding pass and facial recognition on the Incheon Airport Smartpass app may use the dedicated Smartpass lane regardless of their boarding zone. \nUnregistered passengers, please wait until your designated zone is called. \nJin Air offers pre-boarding for passengers needing assistance, including those traveling with infants under 24 months, elderly passengers, and pregnant passengers. \nTo ensure a smooth process, we are boarding by zones. We are currently boarding Zone C, rows 47 through 59. \nPassengers in Zones B and A, please remain seated until your zone is called. \nPlease have your passport photo page and boarding pass ready. For identity verification, kindly remove any masks, sunglasses, or hats. Thank you.', link: '' }
        ]
      },
      {
        subId: '3-4',
        title: '3-4. B737 탑승 직전 안내 & C ZONE 탑승 안내(일문)',
        blocks: [
          { type: 'VOICE', lang: '일문', text: 'ジンエアーLJ{{편명}}便、{{목적지}}行きは、まもなくご搭乗を開始いたします。ご利用のお客様は、{{게이트}}番搭乗口よりご搭乗ください。' },
          { type: 'AI', lang: '일문', text: '仁川空港スマートパスアプリで搭乗券と顔認証をご登録のお客様は、ゾーンに関わらず専用レーンをご利用いただけます。\nご登録のないお客様は、ご自身の搭乗ゾーンの案内までお待ちください。\nジンエアーでは、24か月未満の幼児をお連れのお客様、ご年配のお客様、妊娠中のお客様など、優先搭乗をご案内しております。\nまた、スムーズなご案内のためゾーンボディーングを実施しております。ただいま搭乗券に Zone C と記載された47列から59列のお客様よりご案内しております。\nZone B、Zone Aのお客様は、恐れ入りますがそのままお待ちください。\n搭乗口ではパスポートの顔写真ページと搭乗券を確認いたします。スムーズな本人確認のため、マスク、サングラス、帽子などはあらかじめお外しいただきますようご協力をお願いいたします。', link: '' }
        ]
      },
      {
        subId: '3-5',
        title: '3-5. B737 탑승 직전 안내 & C ZONE 탑승 안내(중문)',
        blocks: [
          { type: 'VOICE', lang: '중문', text: '飞往{{목적지}}的真航空 LJ{{편명}}航班即将开始登机。请前往{{게이트}}号登机口准备登机。' },
          { type: 'AI', lang: '중문', text: '已通过仁川机场斯玛特通 应用 注册登机牌和面部信息的旅客，无需确认登机区域，请走斯玛特通 应专用通道登机。\n未注册的旅客，请按照您的登机区域顺序准备登机。\n真航空为携带24个月以下婴儿的旅客、年长者及孕妇等需要帮助的旅客提供优先登机服务。\n同时，为了确保顺利登机，我们正在实施按区域登机。请登机牌上显示为Zone C、座位在47排至59排的旅客优先登机。\nZone B和Zone A的旅客，请您稍作等待。\n登机前我们将核对您的护照照片页和登机牌。为了准确确认身份，请您提前取下口罩、墨镜和帽子，积极配合我们的工作。谢谢。', link: '' }
        ]
      },
      {
        subId: '3-6',
        title: '3-6. B737 B ZONE 탑승 안내',
        blocks: [
          { type: 'AI', lang: '국문', text: '기다려 주셔서 감사합니다.\n탑승권 상 ZONE B로 표시되어있는 34열부터 46열의 승객께서는 지금 탑승해주시기 바라며, ZONE A에 해당하시는 승객께서는 잠시 대기하여주시기 바랍니다.\n탑승 전 여권 사진면과 탑승권을 확인하고 있습니다. 정확한 신원확인을 위해 착용하신 마스크, 선글라스, 모자 등 미리 착용을 벗어두시어 신원확인에 적극 협조해주시기 바랍니다. 감사합니다.', link: '' },
          { type: 'AI', lang: '영문', text: 'Thank you for your patience. Passengers with Zone B on their boarding pass, sitting in rows 34 through 46, may now board. Passengers in Zone A, please remain seated until your zone is called. Please have your passport photo page and boarding pass ready. For identity verification, kindly remove any masks, sunglasses, or hats in advance. Thank you.', link: '' },
          { type: 'AI', lang: '일문', text: '大変お待たせいたしました。ただいま搭乗券に Zone B と記載された34列から46列のお客様をご案内しております。Zone Aのお客様は、恐れ入りますがそのままお待ちください。搭乗口ではパスポートの顔写真ページと搭乗券を確認いたします。スムーズな本人確認のため、マスク、サングラス、帽子などはあらかじめお外しいただきますようご協力をお願いいたします。', link: '' },
          { type: 'AI', lang: '중문', text: '感谢您的耐心中候。请登机牌上显示为 B区、座位在34排至46排的旅客现在登机。A区的旅客，请您稍作等待。登机前我们将核对您的护照照片页和登机牌。为了准确确认身份，请您提前取下口罩、墨镜和帽子，积极配合我们的工作。谢谢。', link: '' }
        ]
      },
      {
        subId: '3-7',
        title: '3-7. B737 모든 승객 탑승 안내',
        blocks: [
          { type: 'VOICE', lang: '국문', text: '진에어 LJ{{편명}}편, {{목적지}}행의 모든 승객께서는 {{게이트}}번으로 탑승해주시기 바랍니다.\n신원확인을 위해 여권 사진면과 탑승권을 함께 준비해주시기 바랍니다.' },
          { type: 'VOICE', lang: '영문', text: 'We now invite all remaining passengers on Jin Air flight LJ{{편명}} bound for {{목적지}} to board at Gate {{게이트}}.\nPlease have your passport open to the photo page and your boarding pass ready.' },
          { type: 'VOICE', lang: '일문', text: 'お待たせいたしました。\nジンエアーLJ{{편명}}便 {{목적지}}行き、すべて お客様 ご搭乗ください。\nご本人確認のため、パスポート 写真ページと搭乗券をご用意ください。 \nありがとうございます。' },
          { type: 'VOICE', lang: '중문', text: '真航空 LJ{{편명}}航班飞往{{목적지}}的所有旅客，请现在前往{{게이트}}号登机口登机。\n为了确认身份，请提前准备好护照照片页以及登机牌。' }
        ]
      }
    ]
  },
  {
    id: 'sec-4',
    icon: <UserX size={16} />,
    title: '4. FINAL CALL / PAGING',
    items: [
      {
        subId: '4-1',
        title: '4-1. 탑승 마감',
        blocks: [
          { type: 'VOICE', lang: '국문', text: '진에어에서 마지막 탑승 안내 말씀 드리겠습니다. \n진에어 LJ{{편명}}편 {{목적지}}행 항공기는 모든 준비를 마치고 곧 출발할 예정이오니, 아직까지 탑승하지 않은 승객께서는 {{게이트}}탑승구로 속히 탑승하여 주시기 바랍니다' },
          { type: 'VOICE', lang: '영문', text: 'May I have your attention please.\nThis is the final boarding call for JINAIR flight LJ{{편명}} bound for {{목적지}}.\nAll remaining passengers please proceed to the gate {{게이트}} for immediate boarding.' },
          { type: 'VOICE', lang: '일문', text: 'ジンエアーより、最終搭乗のご案内を申し上げます。\nジンエアーLJ{{편명}}便、{{목적지}}行きは、まもなく出発いたします。\nまだご搭乗でないお客様は、至急{{게이트}}番搭乗口までお越しください。' },
          { type: 'VOICE', lang: '중문', text: '乘坐真航空 LJ{{편명}}航班前往{{목적지}}的旅客请注意。\n飞往{{목적지}}的真航空 LJ{{편명}}航班已经完成所有准备，即将起飞。\n尚未登机的旅客，请立即前往{{게이트}}号登机口登机。' }
        ]
      },
      {
        subId: '4-2',
        title: '4-2. 승객 PAGING',
        blocks: [
          { type: 'VOICE', lang: '국문', text: '진에어 에서 승객을 찾습니다. 금일 {{목적지}}으로 출국하시는 {{이름}}님, {{이름}}님 계시면\n{{게이트}}탑승구로 나오시어 직원의 안내를 받으시기 바랍니다.' },
          { type: 'VOICE', lang: '영문', text: 'May I have your attention, please.\nJinAir is looking for passenger(s) {{이름}}, traveling to {{목적지}}.\nPlease proceed to the gate {{게이트}}, gate {{게이트}} immediately.\nThank you.' },
          { type: 'VOICE', lang: '일문', text: '진-에아- 요리 오캬쿠사마노 오요비다시오 모우시아게마스.\n혼지츠、00지 하츠 00훈(분, 푼), 에루제이 {{편명}}빙, {{목적지}}유키오 고리요-요테이노, {{이름}}사마.\n코-쿠-키노 토-죠-치코쿠오 스기떼오리, 시큐-, {{게이트}}방 토-죠-구치마데 오코시 쿠다사이.' },
          { type: 'VOICE', lang: '중문', text: 'Chéngzuò LJ{{편명}} hángbān qiánwǎng {{목적지}} de lǚkè qǐng zhùyì, xiàn xúnzhǎo lǚkè. Jīnrì qiánwǎng {{목적지}} de {{이름}} xiānshēng (nǚshì), qǐng jǐnkuài qiánwǎng {{게이트}} hào dēngjīkǒu, pèihé gōngzuò rényuán de zhǐyǐn.' }
        ]
      }
    ]
  },
  {
    id: 'sec-5',
    icon: <AlertOctagon size={16} />,
    title: '5. GATE IRRE (지연/결항)',
    items: [
      {
        subId: '5-1',
        title: '5-1. 탑승 지연 - 시간 미정',
        blocks: [
          { type: 'VOICE', lang: '국문', text: '진에어에서 탑승 지연 안내말씀 드리겠습니다.\n금일 {{시간}} 출발 예정인 진에어 LJ{{편명}}편 {{목적지}}행은 {{사유}}로 인해 탑승이 지연되고 있습니다.\n정확한 탑승(또는 출발)시간은 결정되는 대로 다시 안내해 드릴 예정이오니, 승객 여러분께서는 {{게이트}}번 탑승구 주변에서 (잠시) 기다려주시기 바랍니다. 승객 여러분께 불편을 끼쳐드려 대단히 죄송합니다.' },
          { type: 'VOICE', lang: '영문', text: 'May I have your attention please.\nJINAIR flight LJ{{편명}} bound for {{목적지}} will be delayed due to {{사유}}.\nThe new boarding time will be announced as soon as possible.\nSorry for your inconvenience.' }
        ]
      },
      {
        subId: '5-2',
        title: '5-2. 탑승 지연 - 시간 확정',
        blocks: [
          { type: 'VOICE', lang: '국문', text: '진에어에서 안내말씀 드리겠습니다.\n진에어 LJ{{편명}}편 {{목적지}}행은 {{사유}}으로 인하여 탑승이 지연되어 {{시간}} 탑승을 시작할 예정입니다.\n승객 여러분께 불편을 끼쳐드려 대단히 죄송합니다.' },
          { type: 'VOICE', lang: '영문', text: 'May I have your attention please.\nJINAIR flight LJ{{편명}} bound for {{목적지}} will be delayed due to {{사유}}.\nThe new boarding time will be {{시간}}.\nSorry for your inconvenience.' }
        ]
      },
      {
        subId: '5-3',
        title: '5-3. 항공기 교체 지연',
        blocks: [
          { type: 'VOICE', lang: '국문', text: '진에어에서 탑승 지연 안내말씀 드리겠습니다.\n금일 진에어 LJ{{편명}}편 {{목적지}}행은 항공기 정비관계로 인해 항공기를 교체하게 되어 출발이 지연 될 예정입니다.\n변경된 출발 시간은 {{시간}} 예정이오니, 승객 여러분께서는 {{게이트}}번 탑승구 주변에서 기다려주시기 바랍니다. 승객 여러분께 불편을 끼쳐드려 대단히 죄송합니다.' },
          { type: 'VOICE', lang: '영문', text: 'May I have Your attention please.\nJINAIR flight LJ{{편명}} bound for {{목적지}} will be delayed due to a change of aircraft for maintenance reasons.\nThe new boarding time will be {{시간}}. <And new boarding gate will be {{새게이트}}>.\nSorry for your inconvenience.' }
        ]
      },
      {
        subId: '5-4',
        title: '5-4. 결항',
        blocks: [
          { type: 'VOICE', lang: '국문', text: '진에어에서 안내 말씀드립니다. \n금일 진에어 LJ{{편명}}편 {{목적지}}행은 항공기 {{사유}}로 인하여 결항되었습니다. \n손님 여러분께서는 탑승권과 여권을 준비하시고 {{목적지}}에서 저희 직원의 안내를 받아 주시기 바랍니다. \n불편을 끼쳐드려 대단히 죄송합니다' },
          { type: 'VOICE', lang: '영문', text: 'May I have your attention please. \nJINAIR flight LJ{{편명}} bound for {{목적지}} will be cancelled due to {{사유}}. \nPlease have your passport and boarding pass ready and come to GATE {{목적지}} for further arrangements. \nSorry for your inconvenience.' }
        ]
      },
      {
        subId: '5-5',
        title: '5-5. 탑승구 변경',
        blocks: [
          { type: 'VOICE', lang: '국문', text: '진에어에서 안내말씀 드리겠습니다. 진에어 LJ{{편명}}편 {{목적지}}행의 탑승구가 {{게이트}}에서 {{새게이트}}으로 변경 되었습니다. \n승객 여러분께서는 변경된 {{새게이트}}탑승구에서 대기하여 주시기 바랍니다.\n승객 여러분께 불편을 끼쳐드려 대단히 죄송합니다.' },
          { type: 'VOICE', lang: '영문', text: 'May I have your attention, please.\nThe departure gate for Jin Air flight LJ{{편명}} bound for {{목적지}} has been changed from gate {{게이트}} to gate {{새게이트}}.\nPlease proceed to the new gate, {{새게이트}}.\nSorry for your inconvenience.' }
        ]
      }
    ]
  },
  {
    id: 'sec-6',
    icon: <MonitorSmartphone size={16} />,
    title: '6. 기타 GATE 안내',
    items: [
      {
        subId: '6-1',
        title: '6-1. GATE 스마트패스 & 신원확인 안내(국, 영)',
        blocks: [
          { type: 'AI', lang: '국문', text: '진에어에서 안내 말씀 드리겠습니다.  \n사전에 인천공항 스마트패스 앱으로 탑승권과 안면 정보를 등록하신 승객께서는 ZONE에 관계없이 탑승구의 스마트패스 전용 라인 쪽으로 탑승해주시기 바랍니다. \n등록되지 않은 승객께서는 스마트패스 전용 라인 반대편 라인으로 탑승 해주시기 바랍니다. \n탑승 전 여권 사진면과 탑승권을 확인을 하고 있습니다. \n정확한 신원확인을 위해 착용하신 마스크, 선글라스, 모자 등 미리 착용을 벗어두시어 신원확인에 적극 협조해주시기 바랍니다. 감사합니다.', link: '' },
          { type: 'AI', lang: '영문', text: '(May I have your attention please)\nPassengers who registered their boarding pass and facial recognition via the Incheon Airport Smartpass app may use the dedicated Smartpass lane regardless of their zone. \nUnregistered passengers, please board using the line on the opposite side of the Smartpass lane. \nPlease have your passport photo page and boarding pass ready before boarding. For identity verification, kindly remove any masks, sunglasses, or hats in advance. Thank you.', link: '' }
        ]
      },
      {
        subId: '6-2',
        title: '6-2. GATE 스마트패스 & 신원확인 안내(일, 중)',
        blocks: [
          { type: 'AI', lang: '일문', text: '(ジンエアーより、ご案内いたします。  )\n仁川空港スマートパスアプリで搭乗券と顔認証をご登録のお客様は、ゾーンに関わらず専用レーンをご利用いただけます。\nご登録のないお客様は、スマートパス専用レーンの反対側の列よりご搭乗ください。\n搭乗口ではパスポートの顔写真ページと搭乗券を確認いたします。\nスムーズな本人確認のため、マスク、サングラス、帽子などはあらかじめお外しいただきますようご協力をお願いいたします。', link: '' },
          { type: 'AI', lang: '중문', text: '(真航空提醒您。) \n已通过仁川机场斯玛特通应用注册登机牌和面部信息的旅客，无需确认登机区域，请走斯玛特通专用通道登机。\n未注册的旅客，请在斯玛特通专用通道的另一侧排队登机。\n登机前我们将核对您的护照照片页和登机牌。\n为了准确确认身份，请您提前取下口罩、墨镜和帽子，积极配合我们的工作。\n谢谢。', link: '' }
        ]
      }
    ]
  },
  {
    id: 'sec-7',
    icon: <AlertTriangle size={16} />,
    title: '7. CNTR 대고객 안내',
    items: [
      {
        subId: '7-1',
        title: '7-1. CNTR 대기 승객 안내(2번 출국장 안내 포함) (국, 영)',
        blocks: [
          { type: 'AI', lang: '국문', text: '진에어에서 승객 여러분께 안내 말씀드리겠습니다.\n빠른 탑승수속을 위해 사전에 여권과 탑승권 또는 E-Ticket 등의 서류를 미리 준비하여 주시기 바랍니다. \n또한, 1번 출국장이 매우 혼잡할 수 있으니, 보다 원활한 출국을 위해 2번 출국장을 이용하여 주시기 바랍니다. \n탑승수속을 마치신 승객께서는 출국장으로 신속히 이동하여 주시기 바랍니다. \n아울러, 항공기 출발 10분 전에는 탑승이 마감되오니, 탑승구로 미리 이동하여 주시기 바랍니다. \n감사합니다.', link: '' },
          { type: 'AI', lang: '영문', text: 'May I have your attention please.\nTo help expedite the check-in process, please have your passport and boarding pass or E-ticket ready in advance.\nDuring peak hours, Departure Hall 1 may become very crowded. For a smoother departure process, we recommend using Departure Hall 2.\nPassengers who have completed check-in are kindly requested to proceed promptly to the departure security checkpoint.\nPlease note that boarding closes 10 minutes before the scheduled departure time. To avoid any inconvenience, please proceed to your boarding gate in advance.\nThank you.', link: '' }
        ]
      },
      {
        subId: '7-2',
        title: '7-2. CNTR 대기 승객 안내(2번 출국장 안내 포함) (일, 중)',
        blocks: [
          { type: 'AI', lang: '일문', text: 'ジンエアーよりご案内いたします。\nスムーズなチェックインのため、あらかじめパスポート、搭乗券、またはEチケットをご用意ください。\nまた、混雑する時間帯には、第1出国場が大変混雑する場合がございます。よりスムーズなご出国のため、第2出国場をご利用ください。\nチェックインをお済ませのお客様は、お早めに出国場へお進みください。\nなお、搭乗は出発時刻の10分前に締め切りとなりますので、お時間に余裕をもって搭乗口へお越しください。\nありがとうございます。', link: '' },
          { type: 'AI', lang: '중문', text: '各位旅客，您好！这里是真航空。\n为了加快办理乘机手续，请提前准备好您的护照、登机牌或电子客票等相关证件。\n另外，在繁忙时段，1号出境大厅可能会非常拥挤。为了更加顺利地办理出境手续，建议您使用2号出境大厅。\n已完成乘机手续的旅客，请尽快前往出境大厅。\n另外，航班将于起飞前10分钟停止登机，请提前前往登机口，以免影响您的行程。\n谢谢您的配合。', link: '' }
        ]
      },
      {
        subId: '7-3',
        title: '7-3. CNTR 금지물품 안내(한, 영)',
        blocks: [
          { type: 'AI', lang: '국문', text: '진에어에서 안내말씀 드리겠습니다. \n여권 훼손 시 해당 국가 입국이 거절될 수 있사오니, 훼손된 여권을 소지한 승객께서는 직원에게 문의하여 주시기 바랍니다. \n아울러 라이터, 휴대폰 보조배터리, 전자담배, 귀중품 등은, 위탁 수하물로의 반입이 금지되어 있사오니, 이 물품을 소지하신 승객께서는, 휴대하여, 기내로 반입하여 주시기 바랍니다. \n또한 무선 고데기, 무선 빗, 등의 무선 발열 물품은, 위탁 및 기내반입이 금지되오니, 해당 물품을 소지하신 승객께서는, 직원에게 문의하여 주시기 바랍니다. \n감사합니다.', link: '' },
          { type: 'AI', lang: '영문', text: 'May I have your attention, please. \nPlease be advised that passengers traveling with a damaged passport may be denied entry by the destination country. \nIf your passport is damaged, please contact a member of our staff.In addition, lighters, portable power banks, electronic cigarettes, valuables, and similar items are not permitted in checked baggage. \nIf you are carrying any of these items, please keep them with you and bring them on board as carry-on baggage. \nFurthermore, cordless heating devices, such as cordless hair irons and cordless heated hair brushes, are prohibited in both checked baggage and carry-on baggage. \nIf you are carrying any of these items, please contact a member of our staff. \nThank you.', link: '' }
        ]
      },
      {
        subId: '7-4',
        title: '7-4. CNTR 금지물품 안내(일, 중)',
        blocks: [
          { type: 'AI', lang: '일문', text: 'ジンエアーよりご案内申し上げます。\nパスポートが破損している場合、渡航先の国への入国を拒否される場合がございます。\n破損したパスポートをお持ちのお客様は、係員までお申し出ください。\nまた、ライター、モバイルバッテリー、電子たばこ、貴重品などは、受託手荷物としてお預けいただけません。\nお持ちのお客様は、お手元にお持ちいただき、機内へお持ち込みください。\nなお、コードレスヘアアイロンやコードレスヘアブラシなどの発熱機器は、受託手荷物・機内持ち込み手荷物ともにお持ち込みいただけません。\nお持ちのお客様は、係員までお問い合わせください。\nありがとうございます。', link: '' },
          { type: 'AI', lang: '중문', text: '各位旅客，您好！这里是真航空（Jin Air）。\n请注意，如您的护照有破损，目的地国家可能会拒绝您入境。\n如您持有破损护照，请向工作人员咨询。另外，打火机、充电宝、电子烟、贵重物品等禁止放入托运行李。\n如您携带上述物品，请随身携带，并带入客舱。此外，无线卷发棒、无线直发器、无线电热梳等无线发热物品，禁止托运，也禁止随身携带登机。如您携带此类物品，请向工作人员咨询。\n感谢您的理解与配合。 \n祝您旅途愉快。', link: '' }
        ]
      },
      {
        subId: '7-5',
        title: '7-5. CNTR 셀프백드롭(SBD) 안내',
        blocks: [
          { type: 'AI', lang: '국문', text: '진에어에서 안내 말씀드리겠습니다. \n사전에 온라인 체크인 또는 공항 키오스크에서 탑승수속을 완료하신 승객 중 수하물을 위탁하실 경우, 뒤편 F카운터의 셀프백드롭(Self Bag Drop)을 이용하시면 더욱 빠르고 편리하게 이용하실 수 있습니다. \n많은 이용 부탁드립니다. 감사합니다.', link: '' },
          { type: 'AI', lang: '영문', text: 'May I have your attention please. \nPassengers who have completed check-in online or at the airport self-service kiosk and wish to check baggage may use the Self Bag Drop at Counter F. \nYou can check your baggage more quickly and conveniently. Thank you.', link: '' },
          { type: 'AI', lang: '일문', text: 'お客様にご案内いたします。\nオンラインチェックイン、または空港の自動チェックイン機でチェックインをお済ませのお客様で、お手荷物をお預けになる場合は、 Fカウンターのセルフバッグドロップをご利用いただくと、よりスムーズにお手続きいただけます。\nご利用をお願いいたします。 ありがとうございます。', link: '' },
          { type: 'AI', lang: '중문', text: '请注意。已完成网上值机或机场自助值机手续，并需要托运行李的旅客， 请使用 F 柜台 Self Bag Drop（自助行李托运）。您可更加快捷、方便地办理行李托运。谢谢您的配合。', link: '' }
        ]
      },
      {
        subId: '7-6',
        title: '7-6. CNTR 보조배터리 안내(국문, 영문)',
        blocks: [
          { type: 'AI', lang: '국문', text: '진에어에서 안내 말씀드리겠습니다. \n항공기 탑승 후 보조배터리와 전자담배의 사용 및 충전은 금지되며, \n또한 기내 선반 보관은 엄격히 금지되어 있습니다. \n보조배터리는 160Wh 이하 최대 2개까지 반입 가능하며, \n160Wh 초과 시 반입이 불가합니다. 반드시 직접 휴대하시거나 좌석 앞 주머니에 보관해주시고, \n단락 방지를 위해 절연테이프를 부착해주시기 바랍니다. 감사합니다.', link: '' },
          { type: 'AI', lang: '영문', text: 'May I have your attention please. \nAfter boarding, the use and charging of portable batteries and electronic cigarettes are strictly prohibited. \nIn addition, storing portable batteries in the overhead bins is strictly prohibited. \nEach passenger may carry up to two portable batteries under 160Wh. Portable batteries exceeding 160Wh are not allowed onboard. \nPlease keep portable batteries with you at all times or place them in the seat pocket in front of you. \nTo prevent short circuits, please apply insulating tape to the terminals. Thank you for your cooperation.', link: '' }
        ]
      },
      {
        subId: '7-7',
        title: '7-7. CNTR 보조배터리 안내(일문, 중문)',
        blocks: [
          { type: 'AI', lang: '일문', text: 'ジンエアーよりご案内申し上げます。 \nご搭乗後、モバイルバッテリーおよび電子タバコの使用や充電などは禁止されておりま す。 \nまた、座席上の物入れに保管することは厳しく禁止されております。 \nモバイルバッテリーはおひとり様2個まで、160Wh以下のものに限り、機内持ち込み可能 でございます。 160Whを超えるものは機内持ち込みいただけません。 \nモバイルバッテリーはお手元にお持ちになるか、座席前のポケットにお入れください。ま た、ショート防止のため、端子部分をテープで保護、もしくはビニール袋にお入れ、絶縁処 理をお願いいたします。 \nご協力いただき、誠にありがとうございます。', link: '' },
          { type: 'AI', lang: '중문', text: '各位旅客，您好。歡迎搭乘真航空航班。\n登機後，嚴禁使用或充電行動電源及電子菸。此外，嚴禁將行動電源放置於座位上方的置物櫃內。\n每位旅客最多可攜帶兩個一百六十瓦時（160Wh）以下的行動電源登機，超過一百六十瓦時（160Wh）的行動電源禁止攜帶登機。\n請務必將行動電源隨身攜帶，或放置於前方座椅口袋內。\n為避免短路，請使用絕緣膠帶保護電池端子，或放入獨立塑膠袋內做好絕緣處理。\n感謝您的理解與配合。', link: '' }
        ]
      }
    ]
  },
  {
    id: 'sec-8',
    icon: <Clock size={16} />,
    title: '8. 개정 이력',
    items: [
      {
        subId: '8-1',
        title: '버전 관리 내역 (VER 3.0)',
        blocks: [
          { type: 'VOICE', lang: '공지', text: 'Ver. 0.1 (2026.07.06) - GATE 표준 안내방송문 매뉴얼 최초 작성 (SH.CHO)\nVer. 0.2 (2026.07.08) - 목차(하이퍼링크) 기능 추가 (SH.CHO)\nVer. 0.3 (2026.07.14) - 매뉴얼 내 AI 음성 재생 링크 및 Google Drive 연동 (SH.CHO)\nVer. 1.0 (2026.07.14) - GATE 표준 안내방송문 매뉴얼 배포 공지 (SH.CHO)\nVer. 1.1 (2026.07.16) - 일부 방송문 문구 및 AI음성 파일 수정 (by ICNKK)\nVer. 1.5 (2026.08.03) - GATE / CNTR 표준 안내방송문 수정 공지 (SH.CHO)\nVer. 2.0 (2026.09.21) - 탑승 직전, 탑승중 안내방송문 및 AI 음성 파일 변경 (by 이다희 주임)\nVer. 3.0 (최신) - 모바일 최적화 웹 사운드보드 런칭 및 가변 데이터 자동화 적용' }
        ]
      }
    ]
  }
];

export default function PaSoundboardMobile() {
  const [activeSection, setActiveSection] = useState(MANUAL_DATA[0].id);
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  // --- 가변 데이터 상태 관리 ---
  const [flightNum, setFlightNum] = useState('');
  const [dest, setDest] = useState('');
  const [gate, setGate] = useState('');
  const [time, setTime] = useState('');
  const [delayRzn, setDelayRzn] = useState('');
  const [paxName, setPaxName] = useState('');
  const [newGate, setNewGate] = useState('');

  // 구글 드라이브 새 창 열기 (앱 연결)
  const handlePlayClick = (link?: string) => {
    if (link) {
      window.open(link, '_blank');
    } else {
      alert('현재 연결된 구글 드라이브 AI 음성 링크가 없습니다.\n코드의 link: "" 부분에 주소를 입력해주세요.');
    }
  };

  // 텍스트 자동 완성 변환 함수 (Fallback 포함)
  const formatText = (rawText: string) => {
    return rawText
      .replace(/\{\{편명\}\}/g, flightNum ? flightNum : '( 편명 )')
      .replace(/\{\{목적지\}\}/g, dest ? dest : '( 목적지 )')
      .replace(/\{\{게이트\}\}/g, gate ? gate : '( 탑승구 )')
      .replace(/\{\{시간\}\}/g, time ? time : '00시 00분')
      .replace(/\{\{사유\}\}/g, delayRzn ? `[ ${delayRzn} ]` : '[ 지연/결항 사유 ]')
      .replace(/\{\{이름\}\}/g, paxName ? paxName : '[ 성함 ]')
      .replace(/\{\{새게이트\}\}/g, newGate ? newGate : '< 새 탑승구 >');
  };

  const renderContent = () => {
    const section = MANUAL_DATA.find((s) => s.id === activeSection);
    if (!section) return null;

    return (
      <div className="space-y-6 animate-fade-in pb-12">
        <div className="border-b-2 border-slate-800 pb-3">
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">{section.title}</h2>
        </div>

        {section.items.map((item) => (
          <div key={item.subId} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-slate-100 border-b border-gray-200 px-4 py-3">
              <h3 className="font-extrabold text-slate-800 text-[15px] leading-snug">{item.title}</h3>
            </div>
            <div className="p-4 space-y-6">
              {item.blocks.map((block, idx) => (
                <div key={idx} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className={`inline-block px-3 py-1.5 text-[11px] font-black rounded-lg border ${
                      block.type === 'AI' ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-gray-100 text-gray-700 border-gray-300'
                    }`}>
                      {block.lang} {block.type === 'AI' ? '(AI 음성)' : '(직원 육성)'}
                    </span>
                    {block.type === 'AI' && (
                      <button
                        onClick={() => handlePlayClick(block.link)}
                        className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-black transition-transform active:scale-95 shadow-md ${
                          block.link ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                        }`}
                      >
                        <Play size={16} fill="currentColor" /> {block.link ? '재생하기' : '링크 대기'}
                      </button>
                    )}
                  </div>
                  <div className={`p-4 rounded-2xl whitespace-pre-wrap leading-relaxed text-[15px] md:text-lg font-bold tracking-tight ${
                    block.type === 'AI' ? 'bg-blue-50/50 text-blue-900 border border-blue-100' : 'bg-gray-50 text-slate-900 border border-gray-200'
                  }`}>
                    {formatText(block.text)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      
      {/* 1. 모바일 친화적 입력 컨트롤 패널 (아코디언 방식) */}
      <div className="bg-white shadow-md z-30 flex-shrink-0 relative">
        <div className="bg-slate-900 px-4 py-3 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <span className="font-black text-lg tracking-widest">JIN AIR PA</span>
            <span className="text-[10px] bg-lime-500 text-slate-900 px-1.5 py-0.5 rounded font-bold">VER 3.0</span>
          </div>
          <button onClick={() => setIsPanelOpen(!isPanelOpen)} className="flex items-center gap-1 text-xs font-bold bg-white/20 px-3 py-1.5 rounded-full active:bg-white/30">
            <Settings size={14} /> 설정 {isPanelOpen ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
          </button>
        </div>

        {isPanelOpen ? (
          <div className="p-4 bg-white grid grid-cols-2 gap-3 border-b border-gray-200">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold text-gray-500">편명 (숫자만)</label>
              <div className="flex border border-gray-300 rounded-lg overflow-hidden bg-gray-50 h-10">
                <span className="bg-gray-200 text-gray-600 font-black text-[11px] px-2 flex items-center">LJ</span>
                <input type="text" maxLength={4} value={flightNum} onChange={e => setFlightNum(e.target.value.replace(/[^0-9]/g, ''))} className="w-full px-2 font-black text-slate-900 text-sm bg-transparent outline-none" placeholder="081" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold text-gray-500">목적지</label>
              <input type="text" value={dest} onChange={e => setDest(e.target.value)} className="border border-gray-300 bg-gray-50 rounded-lg px-3 font-black text-slate-900 text-sm outline-none h-10" placeholder="다낭" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold text-gray-500">게이트 번호</label>
              <input type="text" value={gate} onChange={e => setGate(e.target.value)} className="border border-gray-300 bg-gray-50 rounded-lg px-3 font-black text-slate-900 text-sm outline-none h-10" placeholder="253" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold text-gray-500">방송용 시간</label>
              <input type="text" value={time} onChange={e => setTime(e.target.value)} className="border border-gray-300 bg-gray-50 rounded-lg px-3 font-black text-slate-900 text-sm outline-none h-10" placeholder="10시 30분" />
            </div>
            <div className="col-span-2 grid grid-cols-2 gap-3 mt-1 pt-3 border-t border-gray-100">
              <div className="flex flex-col gap-1 col-span-2">
                <label className="text-[10px] font-extrabold text-red-500">지연/결항 사유 (해당 시)</label>
                <select value={delayRzn} onChange={e => setDelayRzn(e.target.value)} className="border border-red-300 bg-red-50 rounded-lg px-2 font-black text-red-800 text-sm outline-none h-10">
                  <option value="">정상 운항 (선택 안함)</option>
                  <option value="항공기 연결관계">항공기 연결관계</option>
                  <option value="기내 준비관계">기내 준비관계</option>
                  <option value="기상악화">출/도착지 공항 기상악화</option>
                  <option value="항공기 점검">항공기 점검</option>
                  <option value="지상 조업">지상 조업</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-extrabold text-gray-500">PAGING 승객 이름</label>
                <input type="text" value={paxName} onChange={e => setPaxName(e.target.value)} className="border border-gray-300 rounded-lg px-3 font-black text-slate-900 text-sm outline-none h-10" placeholder="홍길동" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-extrabold text-orange-600">변경 탑승구</label>
                <input type="text" value={newGate} onChange={e => setNewGate(e.target.value)} className="border border-orange-300 bg-orange-50 rounded-lg px-3 font-black text-orange-900 text-sm outline-none h-10" placeholder="260" />
              </div>
            </div>
            <button onClick={() => setIsPanelOpen(false)} className="col-span-2 mt-2 bg-slate-800 text-white py-3 rounded-xl font-bold text-sm shadow-md active:scale-95 transition">입력 완료 (화면 넓게 보기)</button>
          </div>
        ) : (
          <div className="bg-slate-100 px-4 py-2 border-b border-gray-300 flex justify-center items-center">
             <span className="text-xs font-black text-slate-600">현재 셋팅: LJ{flightNum || '---'} | {dest || '목적지'} | {gate || 'GATE'} | {time || '시간'}</span>
          </div>
        )}
        
        {/* 2. 터치 친화적 가로 스와이프 탭 (Navigation) */}
        <div className="flex overflow-x-auto gap-2 px-4 py-3 bg-white shadow-sm hide-scrollbar">
          {MANUAL_DATA.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`shrink-0 px-4 py-2.5 rounded-full text-xs font-black transition-all flex items-center gap-1.5 border ${
                activeSection === section.id ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-500 border-gray-200'
              }`}
            >
              {section.icon} {section.title.split(' ')[0]} {section.title.split(' ')[1]}
            </button>
          ))}
        </div>
      </div>

      {/* 3. 메인 콘텐츠 스크롤 영역 */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20">
        <div className="max-w-2xl mx-auto">
          {renderContent()}
        </div>
      </main>

    </div>
  );
}