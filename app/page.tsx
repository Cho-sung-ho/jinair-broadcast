"use client";

import React, { useState } from "react";

export default function Home() {
  const [menu, setMenu] = useState("boarding");

  const [destination, setDestination] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [gate, setGate] = useState("");

  const [message, setMessage] = useState("");

  const generateMessage = () => {
    if (menu === "boarding") {
      setMessage(
`Fly Better Fly 진에어에서 탑승 안내 말씀 드리겠습니다.

${destination}(으)로 출발 예정인 진에어 ${flightNumber}편,  곧 탑승을 시작하오니 고객님께서는 ${gate}번 탑승구로 탑승해주시기 바랍니다.`
      );
    }

    if (menu === "final") {
      setMessage(
`Fly Better Fly 진에어에서 마지막 탑승 안내 말씀 드리겠습니다.

${destination}로 출발 예정인 진에어 LJ${flightNumber}편 고객님께서는 즉시 ${gate}번 탑승구로 와주시기 바랍니다.`
      );
    }

    if (menu === "delay") {
      setMessage(
`Fly Better Fly 진에어에서 안내 말씀 드리겠습니다.

${destination}로 출발 예정인 진에어 LJ${flightNumber}편은 항공기 연결 관계로 출발이 지연되고 있습니다. 고객 여러분의 양해 부탁드립니다.`
      );
    }

    if (menu === "english") {
      setMessage(
`Ladies and Gentlemen, we would like to announce the boarding information for Jin Air flight LJ${flightNumber} bound for ${destination}.

Passengers are kindly requested to proceed to Gate ${gate} for boarding. Thank you.`
      );
    }
  };

  const copyMessage = async () => {
    await navigator.clipboard.writeText(message);
    alert("복사되었습니다.");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-10">

      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8">

        <h1 className="text-4xl font-bold mb-8">
          진에어 방송문 생성기
        </h1>

        <div className="flex flex-wrap gap-3 mb-8">

          <button
            onClick={() => setMenu("boarding")}
            className={`px-5 py-3 rounded-xl text-white ${
              menu === "boarding"
                ? "bg-green-600"
                : "bg-gray-400"
            }`}
          >
            일반 탑승
          </button>

          <button
            onClick={() => setMenu("final")}
            className={`px-5 py-3 rounded-xl text-white ${
              menu === "final"
                ? "bg-red-600"
                : "bg-gray-400"
            }`}
          >
            최종 탑승
          </button>

          <button
            onClick={() => setMenu("delay")}
            className={`px-5 py-3 rounded-xl text-white ${
              menu === "delay"
                ? "bg-yellow-500"
                : "bg-gray-400"
            }`}
          >
            지연 안내
          </button>

          <button
            onClick={() => setMenu("english")}
            className={`px-5 py-3 rounded-xl text-white ${
              menu === "english"
                ? "bg-blue-600"
                : "bg-gray-400"
            }`}
          >
            영어 방송
          </button>

        </div>

        <div className="space-y-4">

          <input
            className="w-full border p-4 rounded-xl"
            placeholder="목적지"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />

          <input
            className="w-full border p-4 rounded-xl"
            placeholder="편명"
            value={flightNumber}
            onChange={(e) => setFlightNumber(e.target.value)}
          />

          <input
            className="w-full border p-4 rounded-xl"
            placeholder="탑승구"
            value={gate}
            onChange={(e) => setGate(e.target.value)}
          />

          <div className="flex gap-3">

            <button
              onClick={generateMessage}
              className="bg-green-500 text-white px-6 py-3 rounded-xl"
            >
              방송문 생성
            </button>

            <button
              onClick={copyMessage}
              className="bg-blue-500 text-white px-6 py-3 rounded-xl"
            >
              복사
            </button>

          </div>

          <textarea
            value={message}
            readOnly
            rows={10}
            className="w-full border p-4 rounded-xl"
          />

        </div>

      </div>

    </div>
  );
} 