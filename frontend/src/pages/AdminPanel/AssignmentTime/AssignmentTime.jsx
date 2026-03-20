import moment from "moment";
import { useTranslation } from "react-i18next";
import { ConfigField } from "./ConfigField";
// policies are handled by AdminPanel - no import needed


// Parent Component
export default function AssignmentTime({ configuration, setConfiguration }) {
  const { t } = useTranslation();
  // TODO: fetch policies from API when available; use safe defaults for now\n  const USER_HAS_FIXED_LOCATION = false\n  const USER_DROPOFF_NOTIFICATION = false

  const startHourMaxError = configuration?.start_hour_max?.value && configuration?.start_hour?.value
    ? moment(configuration.start_hour_max.value, "HH:mm:ss").isBefore(moment(configuration.start_hour.value, "HH:mm:ss"))
    : false

  const endHourMinError = configuration?.end_hour_min?.value && configuration?.end_hour?.value
    ? moment(configuration.end_hour_min.value, "HH:mm:ss").isAfter(moment(configuration.end_hour.value, "HH:mm:ss"))
    : false

  return (
    <section className="AssignmentTime">
      <h2>{t('admin.assignment_time_title')}</h2>
      <div className="content_column">

        <ConfigField
          fieldKey="max_time"
          label={t('admin.max_time_label')}
          hint={t('admin.max_time_hint')}
          modalTitle={t('admin.max_time_modal_title')}
          modalDescription={
            <>
              <br />
              <p>{t('admin.max_time_zero_hint')}</p>
              <br />
            </>
          }
          inputType="duration"
          configuration={configuration}
          setConfiguration={setConfiguration}
        />

        <ConfigField
          fieldKey="available_window"
          label={t('admin.avail_window_label')}
          modalTitle={t('admin.avail_window_modal_title')}
          modalDescription={
            <>
              <p>{t('admin.avail_window_modal_p1')}</p>
              <p>{t('admin.avail_window_modal_p2')}</p>
            </>
          }
          inputType="duration"
          configuration={configuration}
          setConfiguration={setConfiguration}
        />

        <div className="row">

          <ConfigField
            fieldKey="start_hour"
            label={t('admin.start_hour_label')}
            hint={
              <>
                {t('admin.start_hour_hint1')}
                <b>{t('admin.start_hour_hint2')}</b>
                <br />
                <i>{t('admin.start_hour_hint3')}</i>
              </>
            }
            modalTitle={t('admin.start_hour_modal_title')}
            inputType="time"
            className={startHourMaxError ? "field-error" : ""}
            configuration={configuration}
            setConfiguration={setConfiguration}
          />

          {configuration?.start_hour_max && (
            <ConfigField
              fieldKey="start_hour_max"
              label={t('admin.start_hour_max_label')}
              hint={
                <>
                  {t('admin.start_hour_max_hint1')}
                  <b>{t('admin.start_hour_max_hint2')}</b>
                  <br />
                  <i>{t('admin.start_hour_max_hint3')}</i>
                </>
              }
              modalTitle={t('admin.start_hour_max_modal_title')}
              inputType="time"
              className={startHourMaxError ? "field-error" : ""}
              configuration={configuration}
              setConfiguration={setConfiguration}
            />
          )}

        </div>
        
        <div className="row">
          {
            configuration?.end_hour_min && (
              <ConfigField
                fieldKey="end_hour_min"
                label={t('admin.end_hour_min_label')}
                hint={t('admin.end_hour_min_hint')}
                modalTitle={t('admin.end_hour_min_modal_title')}
                inputType="time"
                className={endHourMinError ? "field-error" : ""}
                configuration={configuration}
                setConfiguration={setConfiguration}
              />
            )
          }
          <ConfigField
            fieldKey="end_hour"
            label={t('admin.end_hour_label')}
            hint={
              <>
                {t('admin.end_hour_hint1')}
                <b>{t('admin.end_hour_hint2')}</b>
                <br />
                <i>{t('admin.end_hour_hint3')}</i>
              </>
            }
            modalTitle={t('admin.end_hour_modal_title')}
            inputType="time"
            className={endHourMinError ? "field-error" : ""}
            configuration={configuration}
            setConfiguration={setConfiguration}
          />
        </div>

        <ConfigField
          fieldKey="bike_safety_buffer"
          label={t('admin.safety_buffer_label')}
          modalTitle={t('admin.safety_buffer_modal_title')}
          modalDescription={
            <>
              <p>
                {t('admin.safety_buffer_modal_desc')}
              </p>
              <br />
              <br />
              <br />
              <br />
            </>
          }
          inputType="duration"
          configuration={configuration}
          setConfiguration={setConfiguration}
        />

        {USER_DROPOFF_NOTIFICATION && <ConfigField
          fieldKey="assignment_reminder_time"
          label={t('admin.assignment_reminder_time_label')}
          modalTitle={t('admin.assignment_reminder_time_modal_title')}
          modalDescription={
            <>
              <p>
                {t('admin.assignment_reminder_time_desc')}
              </p>
              <br />
              <br />
              <br />
              <br />
            </>
          }
          inputType="duration"
          configuration={configuration}
          setConfiguration={setConfiguration}
        />}   
        

        

      </div>
    </section>
  );
}
