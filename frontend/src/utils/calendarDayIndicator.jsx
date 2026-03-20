import moment from "moment"

function getDayIndicatorType(day, ranges) {
  // day es moment() del día (cualquier hora), aquí lo normalizamos a día
  const d = day.clone().startOf("day")

  let hasMiddle = false
  let hasStart = false
  let hasEnd = false

  for (const r of ranges) {
    const startDay = r.start.clone().startOf("day")
    const endDay = r.end.clone().startOf("day")

    // si el día no está dentro del rango, seguimos
    if (d.isBefore(startDay) || d.isAfter(endDay)) continue

    // single day
    if (startDay.isSame(endDay, "day") && d.isSame(startDay, "day")) {
      return "single"
    }

    if (d.isSame(startDay, "day")) hasStart = true
    else if (d.isSame(endDay, "day")) hasEnd = true
    else hasMiddle = true
  }

  // prioridad
  if (hasStart) return "start"
  if (hasEnd) return "end"
  if (hasMiddle) return "middle"
  return null
}

export default function renderDayFactory(conflictRanges) {
  const toMoment = (v) => {
    if (!v) return null;
    if (moment.isMoment(v)) return v.clone();
    if (v instanceof Date) return moment(v);
    if (typeof v === "number") return moment.unix(v); // asumimos epoch en segundos
    if (typeof v === "string") {
      // si viene como string numérico, lo tratamos como epoch seconds
      if (/^\d+(\.\d+)?$/.test(v)) return moment.unix(Number(v));
      return moment(v); // fallback: date string
    }
    // fallback final: intenta parsear lo que sea
    return moment(v);
  };

  
  const parsedRanges = (conflictRanges || [])
  .map((r) => {
    // Formato nuevo: { start: <moment>, end: <moment> } (o Date/string)
    if (r?.start || r?.end) {
      return {
        start: toMoment(r.start),
        end: toMoment(r.end),
      };
    }

    // Formato viejo: { startEpoch, endEpoch } (epoch seconds)
    if (r?.startEpoch != null || r?.endEpoch != null) {
      return {
        start: r.startEpoch != null ? moment.unix(Number(r.startEpoch)) : null,
        end: r.endEpoch != null ? moment.unix(Number(r.endEpoch)) : null,
      };
    }

    return null;
  })
  .filter(Boolean)


  const renderDay = (date) => {
    const m = moment(date)
    const type = getDayIndicatorType(m, parsedRanges)

    return (
      <div className="cal-day">
        <span>{m.date()}</span>

        {type && (
          <span className={`cal-day__bar cal-day__bar--${type}`} />
        )}
      </div>
    )

  }

  return renderDay
}

