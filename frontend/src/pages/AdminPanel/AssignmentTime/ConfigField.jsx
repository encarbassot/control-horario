import moment from "moment";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useElioAuth } from "../../../contexts/ElioAuthContext";
import { api } from "../../../api/ApiAdapter";
import { TextModal } from "../../../elio-react-components/components/Modals/TextModal/TextModal";
import { InputSelect } from "../../../elio-react-components/components/inputs/InputSelect/InputSelect";
import { InputText } from "../../../elio-react-components/components/inputs/InputText/InputText";
import { InputTime } from "../../../elio-react-components/components/inputs/InputTime/InputTime";
import { Hint } from "../../../elio-react-components/components/Hint/Hint";
import { callApi } from "../../../api/api";
import { URL_CONFIGURATION_UPDATE } from "../../../api/urls";
import icoEdit from "../../../assets/icons/actions/edit.svg";
import { convertSecondsToScale } from "../../../utils/utils";





// Stable base — English keys, never changes with locale
const BASE_TIME_SCALES = [
  { key: "minutes", seconds: 60 },
  { key: "hours",   seconds: 3600 },
  { key: "days",    seconds: 86400 },
  { key: "weeks",   seconds: 604800 },
  { key: "months",  seconds: 2629800 },
  { key: "years",   seconds: 31557600 },
]

const BASE_TIME_SCALES_NO_SMALL = BASE_TIME_SCALES.filter(s => !["minutes","hours"].includes(s.key))

/**
 * ConfigField - Componente reutilizable para campos de configuración
 * 
 * @param {Object} props
 * @param {string} props.fieldKey - Key del campo en configuration (ej: 'max_time', 'start_hour')
 * @param {string} props.label - Etiqueta del campo
 * @param {string} props.hint - Texto de ayuda (opcional)
 * @param {string} props.modalTitle - Título del modal de edición
 * @param {string} props.modalDescription - Descripción en el modal (opcional)
 * @param {string} props.inputType - Tipo de input: 'duration' o 'time'
 * @param {Array} props.timeScales - Escalas de tiempo disponibles (solo para 'duration')
 * @param {Function} props.formatValue - Función para formatear el valor mostrado (opcional)
 * @param {Object} props.configuration - Objeto de configuración
 * @param {Function} props.setConfiguration - Función para actualizar configuración
 */
export function ConfigField({
  fieldKey,
  label,
  hint,
  modalTitle,
  modalDescription,
  inputType = "duration", // 'duration' | 'time' | 'text'
  formatValue,
  emptyLabel,
  showUpdatedAt = false,
  className = "",
  configuration,
  setConfiguration
}) {
  const jwt = api.getAccessToken()
  const { t } = useTranslation();

  // Locale labels keyed by English key — for display and InputSelect options
  const scaleLabels = useMemo(() => ({
    minutes: t('common.scale_minutes'),
    hours:   t('common.scale_hours'),
    days:    t('common.scale_days'),
    weeks:   t('common.scale_weeks'),
    months:  t('common.scale_months'),
    years:   t('common.scale_years'),
  }), [t])

  // For display conversion (all scales)
  const allTimeScales = useMemo(() =>
    BASE_TIME_SCALES.map(s => ({ ...s, name: scaleLabels[s.key] }))
  , [scaleLabels])

  // For the dropdown (no minutes/hours for long durations)
  const timeScaleOptions = useMemo(() =>
    BASE_TIME_SCALES_NO_SMALL.map(s => scaleLabels[s.key])
  , [scaleLabels])

  // All scale options (for fields that might store minutes/hours)
  const allTimeScaleOptions = useMemo(() =>
    BASE_TIME_SCALES.map(s => scaleLabels[s.key])
  , [scaleLabels])
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inpTime, setInpTime] = useState("");
  const [inpScale, setInpScale] = useState("");
  const [inpAmount, setInpAmount] = useState("");
  const [inpText, setInpText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const fieldConfig = configuration?.[fieldKey];
  const currentValue = fieldConfig?.value;

  const openModal = () => {
    if (inputType === "time" && currentValue) {
      setInpTime(moment(currentValue, "HH:mm:ss").format("HH:mm"));
    } else if (inputType === "duration" && currentValue !== undefined) {
      // Convert seconds to best-fit scale, storing the English key
      const seconds = Number(currentValue)
      const best = [...BASE_TIME_SCALES].reverse().find(s => seconds >= s.seconds && seconds % s.seconds === 0) || BASE_TIME_SCALES[0]
      setInpScale(best.key)
      setInpAmount(seconds / best.seconds)
    } else if (inputType === "text") {
      setInpText(currentValue ?? "");
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    let valueToSend;
    
    if (inputType === "time") {
      valueToSend = moment(inpTime, "HH:mm").format("HH:mm:ss");
    } else if (inputType === "text") {
      valueToSend = inpText;
    } else {
      // inpScale is an English key — look up seconds directly from BASE_TIME_SCALES
      const scaleEntry = BASE_TIME_SCALES.find(s => s.key === inpScale)
      valueToSend = scaleEntry.seconds * Number(inpAmount);
    }

    setIsLoading(true);
    const resp = await callApi(
      URL_CONFIGURATION_UPDATE,
      [{ field_id: fieldConfig.id, value: valueToSend }],
      jwt
    );
    setIsLoading(false);

    if (resp.success) {
      setConfiguration(resp.data);
      setIsModalOpen(false);
      setErrMsg("");
    } else {
      setErrMsg(t('admin.config_save_error'));
    }
  };

  const getDisplayValue = () => {
    if (formatValue) {
      return formatValue(currentValue);
    }
    
    if (inputType === "time") {
      return moment(currentValue, "HH:mm:ss").format("HH:mm");
    }
    
    if (inputType === "duration") {
      return currentValue == 0 ? t('admin.config_disabled') : convertSecondsToScale(currentValue, { outputString: true, timeScales: allTimeScales });
    }

    if (inputType === "text") {
      return currentValue || emptyLabel || "—";
    }
    
    return currentValue;
  };

  return (
    <>
      {isModalOpen && (
        <TextModal
          title={modalTitle}
          setIsOpen={() => setIsModalOpen(false)}
          aceptar={handleSubmit}
          aceptarText={t('admin.config_update_btn')}
          aceptarLoading={isLoading}
        >
          {inputType === "time" ? (
            <>
              <InputTime 
                value={inpTime}
                onChange={e => setInpTime(e)}
              />
              {errMsg && <p className="error">{errMsg}</p>}
            </>
          ) : inputType === "text" ? (
            <>
              <InputText
                value={inpText}
                onChange={e => setInpText(e.target.value)}
                error={errMsg}
                autoFocus
                onEnter={handleSubmit}
              />
              {modalDescription && (
                <div style={{maxWidth:"800px"}}>
                  {modalDescription}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="modal_editing_max_time">
                <InputText
                  typeNumber
                  value={inpAmount}
                  onChange={e => setInpAmount(e.target.value)}
                  error={errMsg}
                  autoFocus
                />
                <InputSelect
                  options={allTimeScaleOptions}
                  value={scaleLabels[inpScale] ?? ""}
                  onChange={label => {
                    const entry = BASE_TIME_SCALES.find(s => scaleLabels[s.key] === label)
                    if (entry) setInpScale(entry.key)
                  }}
                />
              </div>
              {modalDescription && (
                <div style={{maxWidth:"800px"}}>
                  {modalDescription}
                </div>
              )}
            </>
          )}
        </TextModal>
      )}
      
      <div className={`content ${className}`} style={{ position: "relative" }}>
        <span>
          {label}
          {hint && <Hint>{hint}</Hint>}
        </span>
        <b>{getDisplayValue()}</b>
        <button className="edit button_muted" onClick={openModal}>
          <img src={icoEdit} alt="" />
        </button>
        {showUpdatedAt && fieldConfig?.updated_at && (
          <p style={{ position: "absolute", bottom: 2, left: 18, fontSize: "0.65rem", opacity: 0.5, margin: 0 }}>
            {t('admin.config_updated_at', {date: moment(fieldConfig.updated_at).format("DD/MM/YY HH:mm")})}
          </p>
        )}
      </div>
    </>
  );
}
