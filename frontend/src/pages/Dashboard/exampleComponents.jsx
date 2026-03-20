export default function ExampleComponents(){
return (<div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", alignItems: "flex-start", padding: "1rem 0" }}>

          {/* ── 1. Free search ─────────────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Free search
            </span>
            <BubbleWrapper
              anchor={
                <input
                  type="text"
                  placeholder="Search…"
                  value={searchVal}
                  onChange={e => setSearchVal(e.target.value)}
                  style={{ border: "none", outline: "none", background: "transparent", width: 160 }}
                />
              }
              top={
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button>A</button>
                  <button>B</button>
                  <button>C</button>
                </div>
              }
              bottom={
                <p style={{ maxWidth: 280, margin: 0, fontSize: "0.82rem", color: "#666", lineHeight: 1.5 }}>
                  Lorem ipsum dolor sit amet, consectetur adipisicing elit.
                </p>
              }
              right={
                <button onClick={() => setSearchVal("")}>✕</button>
              }
            />
          </div>

          {/* ── 2. Select with search ──────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Select with search
            </span>
            <BubbleWrapper
              anchor={
                <input
                  type="text"
                  placeholder={selectedFruit || "Select fruit…"}
                  value={selectSearch}
                  onChange={e => setSelectSearch(e.target.value)}
                  style={{ border: "none", outline: "none", background: "transparent", width: 160 }}
                />
              }
              top={
                selectedFruit
                  ? <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", fontSize: "0.82rem" }}>
                      <span style={{ color: "#444" }}>Selected: <strong>{selectedFruit}</strong></span>
                      <button
                        onClick={() => { setSelectedFruit(""); setSelectSearch("") }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#999", fontSize: "0.9rem", padding: 0 }}
                      >✕</button>
                    </div>
                  : <span style={{ fontSize: "0.82rem", color: "#aaa" }}>Pick a fruit</span>
              }
              bottom={
                <ul style={{ margin: 0, padding: 0, listStyle: "none", maxHeight: 180, overflowY: "auto", width: 200 }}>
                  {filteredFruits.length === 0
                    ? <li style={{ padding: "0.4rem 0.2rem", color: "#aaa", fontSize: "0.85rem" }}>No matches</li>
                    : filteredFruits.map(fruit => (
                        <li
                          key={fruit}
                          onClick={() => { setSelectedFruit(fruit); setSelectSearch("") }}
                          style={{
                            padding: "0.4rem 0.5rem",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: "0.88rem",
                            background: fruit === selectedFruit ? "rgba(25,118,210,0.10)" : "transparent",
                            color: fruit === selectedFruit ? "#1976d2" : "#333",
                            fontWeight: fruit === selectedFruit ? 600 : 400,
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = fruit === selectedFruit ? "rgba(25,118,210,0.16)" : "rgba(0,0,0,0.04)"}
                          onMouseLeave={e => e.currentTarget.style.background = fruit === selectedFruit ? "rgba(25,118,210,0.10)" : "transparent"}
                        >
                          {fruit}
                        </li>
                      ))
                  }
                </ul>
              }
            />
          </div>

          {/* ── 3. Number stepper ─────────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Number stepper
            </span>
            <BubbleWrapper
              anchor={
                <input
                  type="number"
                  value={numVal}
                  onChange={e => setNumVal(Number(e.target.value))}
                  style={{ border: "none", outline: "none", background: "transparent", width: 64, textAlign: "center", fontWeight: 600, fontSize: "1rem" }}
                />
              }
              left={
                <button
                  onClick={() => setNumVal(v => v - 1)}
                  style={{ fontSize: "1.2rem", fontWeight: 700, background: "none", border: "none", cursor: "pointer", padding: "0 0.4rem", color: "#555" }}
                >−</button>
              }
              right={
                <button
                  onClick={() => setNumVal(v => v + 1)}
                  style={{ fontSize: "1.2rem", fontWeight: 700, background: "none", border: "none", cursor: "pointer", padding: "0 0.4rem", color: "#555" }}
                >+</button>
              }
              bottom={
                <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center" }}>
                  {[0, 10, 25, 50, 100].map(v => (
                    <button
                      key={v}
                      onClick={() => setNumVal(v)}
                      style={{
                        fontSize: "0.78rem", padding: "0.2rem 0.5rem", borderRadius: 6,
                        border: "1px solid rgba(0,0,0,0.15)", cursor: "pointer",
                        background: numVal === v ? "rgba(25,118,210,0.10)" : "transparent",
                        color: numVal === v ? "#1976d2" : "#555",
                        fontWeight: numVal === v ? 600 : 400,
                      }}
                    >{v}</button>
                  ))}
                </div>
              }
            />
          </div>

        </div>)
}