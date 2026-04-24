import React, { useState } from "react";

const EMPTY_ADDR = {
  AddressType: "bo_BillTo",
  AddressName: "Define New",
  AddressName2: "", AddressName3: "",
  Street: "", StreetNo: "", Block: "", BuildingFloorRoom: "",
  City: "", ZipCode: "", County: "", State: "",
  Country: "IN",
  GSTType: "", GSTCode: "",
};

const COUNTRIES = [
  { code: "IN", name: "India" }, { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" }, { code: "DE", name: "Germany" },
  { code: "FR", name: "France" }, { code: "AE", name: "UAE" },
  { code: "SG", name: "Singapore" }, { code: "AU", name: "Australia" },
];

export default function AddressTab({ form, setForm }) {
  const addresses = form.BPAddresses || [];
  const billTos = addresses.filter((a) => a.AddressType === "bo_BillTo");
  const shipTos = addresses.filter((a) => a.AddressType === "bo_ShipTo");

  const [selected, setSelected] = useState(null); // { type, index in full array }

  const getFullIndex = (type, localIdx) => {
    let count = 0;
    for (let i = 0; i < addresses.length; i++) {
      if (addresses[i].AddressType === type) {
        if (count === localIdx) return i;
        count++;
      }
    }
    return -1;
  };

  const selectAddr = (type, localIdx) => {
    const fi = getFullIndex(type, localIdx);
    setSelected({ type, localIdx, fullIndex: fi });
  };

  const addNew = (type) => {
    const newAddr = { ...EMPTY_ADDR, AddressType: type };
    const updated = [...addresses, newAddr];
    setForm((p) => ({ ...p, BPAddresses: updated }));
    const newLocalIdx = updated.filter((a) => a.AddressType === type).length - 1;
    setSelected({ type, localIdx: newLocalIdx, fullIndex: updated.length - 1 });
  };

  const saveField = (e) => {
    if (selected === null) return;
    const { name, value } = e.target;
    const updated = [...addresses];
    updated[selected.fullIndex] = { ...updated[selected.fullIndex], [name]: value };
    setForm((p) => ({ ...p, BPAddresses: updated }));
  };

  const setDefault = () => {
    if (selected === null) return;
    const type = selected.type;
    const updated = addresses.map((a, i) => ({
      ...a,
      IsDefault: a.AddressType === type ? (i === selected.fullIndex ? "tYES" : "tNO") : a.IsDefault,
    }));
    setForm((p) => ({ ...p, BPAddresses: updated }));
  };

  const current = selected !== null ? addresses[selected.fullIndex] : null;

  const AddrList = ({ type, label, list }) => (
    <div style={{ marginBottom: 4 }}>
      <div style={{
        background: "#d0d8e4", padding: "3px 8px", fontSize: 11, fontWeight: 700,
        color: "#003366", display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <span>▼ {label}</span>
        <button className="im-btn" style={{ padding: "1px 6px", fontSize: 11 }} onClick={() => addNew(type)}>+</button>
      </div>
      {list.length === 0 && (
        <div
          style={{ padding: "4px 16px", fontSize: 12, color: "#888", cursor: "pointer", background: "#fffde7" }}
          onClick={() => addNew(type)}
        >
          Define New
        </div>
      )}
      {list.map((a, i) => (
        <div
          key={i}
          onClick={() => selectAddr(type, i)}
          style={{
            padding: "4px 16px", fontSize: 12, cursor: "pointer",
            background: selected?.type === type && selected?.localIdx === i ? "#cce0f5" : i % 2 === 0 ? "#fff" : "#f8fafc",
            borderBottom: "1px solid #e8ecf0",
          }}
        >
          {a.AddressName || "Define New"}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ display: "flex", gap: 0, height: "100%", minHeight: 340 }}>
      {/* Left: Address tree */}
      <div style={{ width: 200, borderRight: "1px solid #c8d0da", flexShrink: 0, overflowY: "auto" }}>
        <AddrList type="bo_BillTo" label="Bill To" list={billTos} />
        <AddrList type="bo_ShipTo" label="Ship To" list={shipTos} />
        {current && (
          <div style={{ padding: "8px 10px" }}>
            <button className="im-btn" style={{ width: "100%", fontSize: 11 }} onClick={setDefault}>
              Set as Default
            </button>
          </div>
        )}
      </div>

      {/* Right: Address detail */}
      <div style={{ flex: 1, paddingLeft: 16, overflowY: "auto" }}>
        {!current ? (
          <div style={{ color: "#888", fontSize: 12, padding: 20 }}>Select or add an address.</div>
        ) : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#003366" }}>
                {current.AddressType === "bo_BillTo" ? "Bill To" : "Ship To"}
              </span>
              <a href="#map" style={{ fontSize: 11, color: "#0070c0" }} onClick={(e) => e.preventDefault()}>
                Show Location in Web Browser
              </a>
            </div>
            {[
              ["Address ID", "AddressName"],
              ["Address Name 2", "AddressName2"],
              ["Address Name 3", "AddressName3"],
              ["Street / PO Box", "Street"],
              ["Block", "Block"],
              ["City", "City"],
              ["Zip Code", "ZipCode"],
              ["County", "County"],
              ["State", "State"],
            ].map(([label, name]) => (
              <div className="im-field" key={name} style={{ marginBottom: 3 }}>
                <label className="im-field__label" style={{ flex: "0 0 160px", textAlign: "right" }}>{label}</label>
                <input className="im-field__input" name={name} value={current[name] || ""} onChange={saveField} style={{ maxWidth: 280 }} />
              </div>
            ))}
            <div className="im-field" style={{ marginBottom: 3 }}>
              <label className="im-field__label" style={{ flex: "0 0 160px", textAlign: "right" }}>Country/Region</label>
              <select className="im-field__select" name="Country" value={current.Country || "IN"} onChange={saveField} style={{ maxWidth: 280 }}>
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
            <div className="im-field" style={{ marginBottom: 3 }}>
              <label className="im-field__label" style={{ flex: "0 0 160px", textAlign: "right" }}>Street No.</label>
              <input className="im-field__input" name="StreetNo" value={current.StreetNo || ""} onChange={saveField} style={{ maxWidth: 280 }} />
            </div>
            <div className="im-field" style={{ marginBottom: 3 }}>
              <label className="im-field__label" style={{ flex: "0 0 160px", textAlign: "right" }}>Building/Floor/Room</label>
              <input className="im-field__input" name="BuildingFloorRoom" value={current.BuildingFloorRoom || ""} onChange={saveField} style={{ maxWidth: 280 }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
