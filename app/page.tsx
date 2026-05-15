"use client";

import React, { useState } from "react";

export default function Home() {
  const [type, setType] = useState("boarding");

  const [flight, setFlight] = useState("");
  const [dest, setDest] = useState("");
  const [gate, setGate] = useState("");
  const [time, setTime] = useState("");

  const [delayReason, setDelayReason] = useState("Aircraft Connection");

  const [result, setResult] = useState("");

  const generate = () => {
    let msg = "";

    // ---------------- 일반 탑승 ----------------
    if (type === "boarding") {
      msg = `
[한국어]
Fly Better Fly, 진에어에서, 탑승 안내 말씀드리겠습니다. ${time}, 출발 예정인 진에어 LJ${flight}편, ${dest}행의 탑승을 시작할 예정입니다. 고객님께서는 ${gate}번 탑승구로 탑승하여 주시기 바랍니다. 감사합니다.

[영어]
May I have your attention, please.
This is boarding call for Jinair flight LJ${flight}, bound for ${dest}.
Passengers, please proceed to gate ${gate} for boarding.
Please show your boarding pass to cabin attendants when you get on board.
      `;
    }

    // ---------------- 마지막 탑승 ----------------
    if (type === "final") {
      msg = `
[한국어]
Fly Better Fly, 진에어에서, 마지막 탑승 안내 말씀드리겠습니다. ${time}, 출발 예정인 진에어 LJ${flight}편, ${dest}행 항공기는 곧 출발할 예정이오니 아직 탑승하지 않으신 승객께서는 ${gate}번 탑승구로 탑승하여 주시기 바랍니다. 감사합니다.

[영어]
May I have your attention, please.
This is final boarding call for Jinair flight LJ${flight}, bound for ${dest}.
All remaining passengers, please proceed to gate ${gate} immediately. Thank you.
      `;
    }

    // ---------------- 지연 (미확정) ----------------
    if (type === "delay1") {
      msg = `
[한국어]
진에어에서 죄송한 탑승 지연 안내 말씀드립니다. ${time}, ${dest}행 LJ${flight}편은 ${delayReason}으로 인하여 탑승이 늦어지고 있습니다. 정확한 시간은 결정되는 대로 안내드리겠습니다. 승객 여러분께서는 ${gate}번 탑승구 주변에서 대기 부탁드립니다. 감사합니다.

[영어]
Jinair flight LJ${flight} bound for ${dest} will be delayed due to ${delayReason}.
The new boarding time will be announced as soon as possible.
We apologize for the inconvenience.
      `;
    }

    // ---------------- 지연 (확정) ----------------
    if (type === "delay2") {
      msg = `
[한국어]
진에어에서 죄송한 탑승 지연 안내 말씀드립니다. LJ${flight}편, ${dest}행 항공기는 ${delayReason}으로 인해 ${time}에 탑승을 시작할 예정입니다. 승객 여러분께 불편을 드려 죄송합니다.

[영어]
Jinair flight LJ${flight} bound for ${dest} will be delayed due to ${delayReason}.
Boarding will start at ${time}.
We apologize for the inconvenience.
      `;
    }

    setResult(msg);
  };

  const copy = () => {
    navigator.clipboard.writeText(result);
    alert("복사 완료");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="max-w-5xl mx-auto bg-white p-8 rounded-3xl shadow-xl">

        <h1 className="text-3xl font-bold mb-6">
          ✈️ 진에어 방송문 생성기
        </h1>

        {/* 메뉴 */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button onClick={() => setType("boarding")} className="px-4 py-2 bg-green-500 text-white rounded">
            일반 탑승
          </button>
          <button onClick={() => setType("final")} className="px-4 py-2 bg-red-500 text-white rounded">
            마지막 탑승
          </button>
          <button onClick={() => setType("delay1")} className="px-4 py-2 bg-yellow-500 text-white rounded">
            지연(미확정)
          </button>
          <button onClick={() => setType("delay2")} className="px-4 py-2 bg-orange-500 text-white rounded">
            지연(확정)
          </button>
        </div>

        {/* 입력 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <input placeholder="편명" className="border p-3 rounded" onChange={(e) => setFlight(e.target.value)} />
          <input placeholder="목적지" className="border p-3 rounded" onChange={(e) => setDest(e.target.value)} />
          <input placeholder="탑승구" className="border p-3 rounded" onChange={(e) => setGate(e.target.value)} />
          <input placeholder="시간 (예: 10시 30분)" className="border p-3 rounded" onChange={(e) => setTime(e.target.value)} />
        </div>

        {/* 지연 사유 */}
        <select
          className="border p-3 rounded mb-6 w-full"
          onChange={(e) => setDelayReason(e.target.value)}
        >
          <option>Aircraft Connection</option>
          <option>Cabin Preparation</option>
          <option>Weather condition</option>
          <option>Aircraft Maintenance</option>
        </select>

        {/* 버튼 */}
        <div className="flex gap-3 mb-6">
          <button onClick={generate} className="bg-blue-600 text-white px-5 py-2 rounded">
            생성
          </button>
          <button onClick={copy} className="bg-gray-700 text-white px-5 py-2 rounded">
            복사
          </button>
        </div>

        {/* 결과 */}
        <textarea
          className="w-full h-96 border p-4 rounded"
          value={result}
          readOnly
        />

      </div>
    </div>
  );
}