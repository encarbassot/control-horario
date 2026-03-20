import { useTranslation } from "react-i18next"
import { ConfigField } from "../AdminPanel/AssignmentTime/ConfigField"

export default function LockerCode({configuration,setConfiguration}){
  const { t } = useTranslation()
  return (
    <section className="LockerCode">
      <h2>{t('admin.locker_code_title')}</h2>
      <ConfigField
        fieldKey="locker_code"
        label={t('admin.locker_code_label')}
        modalTitle={t('admin.locker_code_modal_title')}
        modalDescription={
          <>
            <p>{t('admin.locker_code_intro')}</p>
            <p>{t('admin.locker_code_empty_note')}</p>
          </>
        }
        inputType="text"
        emptyLabel={t('admin.locker_code_none')}
        showUpdatedAt
        configuration={configuration}
        setConfiguration={setConfiguration}
      />
    </section>
  )
}