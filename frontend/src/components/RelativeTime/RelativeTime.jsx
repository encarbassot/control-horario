import { useState } from "react";
import PropTypes from "prop-types";
import moment from "moment";
import "./RelativeTime.css";
import { useTranslation } from 'react-i18next';

export default function RelativeTime({ date, showAbsolute=false}){
  const [hover, setHover] = useState(false)
  const { t } = useTranslation()
  if(!date) return null

  const m = moment(date)
  const now = moment()
  const diffSeconds = Math.max(0, now.diff(m, 'seconds'))
  const diffMinutes = Math.max(0, now.diff(m, 'minutes'))
  const diffHours = Math.max(0, now.diff(m, 'hours'))
  const diffDays = Math.max(0, now.diff(m, 'days'))

  const full = m.format("DD/MM/YY HH:mm")

  if(hover || showAbsolute) return <span className="relative-time" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}>{full}</span>

  // Recent
  if(diffSeconds < 60) return <span className="relative-time" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}>{t('components.relative_time.just_now')}</span>

  if(diffMinutes < 60) return <span className="relative-time" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}>{t('components.relative_time.minutes_ago', {n: diffMinutes})}</span>

  if(diffHours < 24) return <span className="relative-time" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}>{t('components.relative_time.hours_ago', {n: diffHours})}</span>

  if(diffDays === 1) return <span className="relative-time" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}>{t('components.relative_time.yesterday', {time: m.format("HH:mm")})}</span>

  // 2 or more days: show date with small time
  return (
    <span className="relative-time" onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}>
      {m.format("DD/MM/YY")} <small>{m.format("HH:mm")}</small>
    </span>
  )
}

RelativeTime.propTypes = {
  date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired
}
