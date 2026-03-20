import { useEffect, useState } from 'react';
// import { Link } from 'react-router-dom';
import './VersionCheck.css';
import { TextModal } from '../../elio-react-components/components/Modals/TextModal/TextModal';
import version from '../../../scripts/version';//'../../../../api/version';
import { callApi } from '../../api/api';
import { URL_CHANGELOG_LIST } from '../../api/urls';
import { API_URL, API_URL_BASE } from '../../CONSTANTS';
import { api } from '../../api/ApiAdapter';
import i18n from '../../i18n/i18n';
import log from '../../utils/log';
import { ROUTES } from '../../routes/navigationConfig';
import icoHome from '../../assets/icons/actions/home.svg';
import { useTranslation } from 'react-i18next';

const production = import.meta.env.PROD;
log("PRODUCTION",production)

export default function VersionCheck({children}) {

  const { t } = useTranslation()
  const [versionUpdate,setVersionUpdate] = useState(false)
  const [versionBlock,setVersionBlock] = useState(false)
  const [maintenanceBlock,setMaintenanceBlock] = useState(false)
  const [changelog,setChangelog] = useState([])

  useEffect(()=>{
    let isMounted = true; // Prevent state updates on unmounted component
    
    handleCheckVersion(isMounted);
    handleCheckMaintenance(isMounted)
    
    return () => { isMounted = false }; // Cleanup on unmount
  },[])

  async function handleCheckMaintenance(isMounted){
    const isBypassAllowed = localStorage.getItem("bypass_maintenance") === "true";

    if (isBypassAllowed) {
      log("Maintenance bypass enabled for testing.");
      return;
  }
  
    if(production){
      try{
        const response = await fetch(`${API_URL_BASE}/maintenance.flag`)
        
        log("APP IN MAINTENANCE")
        setMaintenanceBlock(true)
      }catch{
        log("NOT IN MAINTENANCE")
      }
    }

  }

  async function handleCheckVersion(isMounted){
    const response = await callApi("/version")
    const v = version
    // const v = "v0.3.0"
    const apiVersion = response.data?.version || response.data
    
    const dif = compareVersions(apiVersion,v)
    const _update= dif>=1
    const _block = dif>=2
    console.log("VERSION API",apiVersion,"VERSION WEB:",v,`DIF: ${dif}`,"UPDATE:",_update,"BLOCK:",_block)

    if (dif === 0) return

    const token = api.getAccessToken() || localStorage.getItem("jwt")
    const changelogResponse = await callApi(URL_CHANGELOG_LIST, { from: v, lang: i18n.language }, token)
    console.log("CHANGELOG RESPONSE", changelogResponse)
    if (changelogResponse.data?.entries?.length > 0) {
      setChangelog(changelogResponse.data.entries)
    }

    if (_update){
      setVersionUpdate(true)
    }
    if(_block){
      setVersionBlock(true)
    }
  }

  const isHelpPage = window.location.pathname === ROUTES.HELP

  function handleReload(){
    if ('caches' in window) {
      caches.keys().then(function(names) {
        return Promise.all(names.map(function(name) {
          return caches.delete(name);
        }));
      }).then(function() {
        window.location.reload(true);
      });
    }{
      window.location.reload(true);
    }
  }

  return (<>{
    // application under maintenance (can't bypass)
    !isHelpPage && maintenanceBlock?
      <TextModal title={t('components.version_check.maintenance_title')} aceptar={handleReload}>
        {t('components.version_check.maintenance_message')}
        <ChangelogEntries entries={changelog} />
      </TextModal>

      // version too old, must update to continue (block access until update)
    :!isHelpPage && versionBlock ?  
      <TextModal title={t('components.version_check.mandatory_title')} aceptar={handleReload} aceptarText={t('components.version_check.load')}>
        {t('components.version_check.mandatory_message')}
        <ChangelogEntries entries={changelog} />
        <a href={ROUTES.HELP} onClick={() => window.location.href = ROUTES.HELP}>{t('components.version_check.cant_hide')}</a>
      </TextModal>
      
    // version outdated, update recommended (can bypass)
    : <>
      {!isHelpPage && versionUpdate && 
        <TextModal 
          title={t('components.version_check.update_title')} 
          aceptar={handleReload} 
          aceptarText={t('components.version_check.load')} 
          setIsOpen={setVersionUpdate} 
          cancelar={()=>setVersionUpdate(false)}
        >
          {t('components.version_check.update_message')}
          <ChangelogEntries entries={changelog} />
          <a href={ROUTES.HELP} onClick={() => window.location.href = ROUTES.HELP}>{t('components.version_check.cant_hide')}</a>
        </TextModal>
      }
      {children}
    </>
  }</>)  
}
  

/**
 * Compares two versions in the format x.y.z (or vx.y.z)
 * va = api version, vb = local version
 *
 * Returns:
 *  0  if versions are equal
 *  positive if API is newer than local (update needed) — higher = more severe
 *  negative if local is newer than API (no update needed)
 */
function compareVersions(va, vb) {
  const a = va.replace(/^v/, '').split('.').map(Number);
  const b = vb.replace(/^v/, '').split('.').map(Number);
  const maxLength = Math.max(a.length, b.length);

  // console.log(`[compareVersions] API: ${va} → [${a}]  |  Local: ${vb} → [${b}]`);

  for (let i = 0; i < maxLength; i++) {
    const numA = a[i] || 0;
    const numB = b[i] || 0;

    if (numA !== numB) {
      const result = (numA > numB ? 1 : -1) * (maxLength - i);
      const segment = ['patch', 'minor', 'major'][maxLength - 1 - i] ?? `segment[${i}]`;
      // console.log(`[compareVersions] Mismatch at ${segment}: API=${numA} vs Local=${numB} → result=${result} (${result > 0 ? 'API newer ⬆' : 'Local newer ⬇'})`);
      return result;
    }
  }

  // console.log('[compareVersions] Versions are identical ✓');
  return 0; // Versions are identical
}

function ChangelogEntries({ entries }) {
  if (!entries || entries.length === 0) return null
  return (
    <div className="VersionCheck__changelog">
      {entries.map((entry) => (
        <div key={entry.version} className="VersionCheck__changelog-entry">
          <strong>{entry.version}</strong>
          {entry.date && <span className="VersionCheck__changelog-date"> — {entry.date}</span>}
          <ul>
            {entry.changes.map((change, i) => (
              <li key={i}>{change}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}








const HELP_TABS = [
  {
    id: "android",
    label: "🤖 Android",
    content: (
      <div>
        <p>Las aplicaciones web instaladas (PWA) guardan datos en caché. Sigue estos pasos para forzar la actualización:</p>

        <h2>Chrome (recomendado)</h2>
        <ol>
          <li>Abre <b>Chrome</b> y ve a la aplicación.</li>
          <li>Pulsa los <b>tres puntos</b> (⋮) arriba a la derecha.</li>
          <li>Ve a <b>Configuración del sitio</b>.</li>
          <li>Pulsa <b>Almacenamiento</b> → <b>Borrar datos del sitio</b>.</li>
          <li>Vuelve a abrir la aplicación — cargará la versión más reciente.</li>
        </ol>

        <h2>Alternativa rápida</h2>
        <ol>
          <li>Ve a <b>Ajustes del móvil</b> → <b>Aplicaciones</b>.</li>
          <li>Busca <b>Chrome</b> (o el navegador que uses).</li>
          <li>Pulsa <b>Almacenamiento</b> → <b>Borrar caché</b>.</li>
          <li>Vuelve a abrir la aplicación.</li>
        </ol>

        <p className="note">⚠️ Si tienes la app instalada como PWA en el escritorio, desinstálala y vuelve a añadirla desde el navegador.</p>
      </div>
    ),
  },
  {
    id: "iphone",
    label: "🍎 iPhone",
    content: (
      <div>
        <p>En iOS, la caché de la PWA está ligada al navegador. Sigue estos pasos:</p>

        <h2>Safari (navegador por defecto)</h2>
        <ol>
          <li>Abre <b>Ajustes</b> del iPhone.</li>
          <li>Baja hasta <b>Safari</b> y pulsa.</li>
          <li>Pulsa <b>Borrar historial y datos de sitios web</b>.</li>
          <li>Confirma. Luego vuelve a abrir la aplicación en Safari.</li>
        </ol>

        <h2>Método avanzado (solo este sitio)</h2>
        <ol>
          <li>Abre <b>Ajustes</b> → <b>Safari</b> → <b>Avanzado</b>.</li>
          <li>Pulsa <b>Datos de sitios web</b>.</li>
          <li>Busca el sitio de la aplicación y desliza para eliminar.</li>
        </ol>

        <h2>Chrome en iPhone</h2>
        <ol>
          <li>Abre <b>Chrome</b> → pulsa los <b>tres puntos</b> (···) abajo a la derecha.</li>
          <li>Ve a <b>Configuración</b> → <b>Privacidad</b>.</li>
          <li>Pulsa <b>Borrar datos de navegación</b> → selecciona <b>Imágenes y archivos en caché</b>.</li>
          <li>Pulsa <b>Borrar datos de navegación</b> y confirma.</li>
        </ol>

        <p className="note">⚠️ Si tienes la app añadida a la pantalla de inicio, elimínala y vuelve a añadirla desde Safari.</p>
      </div>
    ),
  },
  {
    id: "chrome",
    label: "🖥️ PC — Chrome",
    content: (
      <div>
        <p>Chrome almacena la PWA con un Service Worker. Un simple F5 no siempre es suficiente.</p>

        <h2>Recarga forzada (método rápido)</h2>
        <ol>
          <li>Con la aplicación abierta, pulsa <code>Ctrl + Shift + R</code> (Windows/Linux) o <code>Cmd + Shift + R</code> (Mac).</li>
        </ol>

        <h2>Vaciar caché desde DevTools (más efectivo)</h2>
        <ol>
          <li>Pulsa <code>F12</code> para abrir las herramientas de desarrollo.</li>
          <li>Haz <b>clic derecho</b> sobre el botón de recarga 🔄 del navegador.</li>
          <li>Selecciona <b>"Vaciar caché y recarga forzada"</b>.</li>
        </ol>

        <h2>Borrar Service Worker y caché</h2>
        <ol>
          <li>Abre <code>F12</code> → pestaña <b>Application</b>.</li>
          <li>En el menú izquierdo busca <b>Service Workers</b>.</li>
          <li>Pulsa <b>Unregister</b> al lado del service worker activo.</li>
          <li>Luego ve a <b>Storage</b> → pulsa <b>Clear site data</b>.</li>
          <li>Recarga la página.</li>
        </ol>

        <p className="note">💡 Alternativamente: Configuración de Chrome → Privacidad y seguridad → Borrar datos de navegación → marca "Archivos en caché".</p>
      </div>
    ),
  },
  {
    id: "firefox",
    label: "🦊 PC — Firefox",
    content: (
      <div>
        <p>Firefox también usa un Service Worker para las PWA. Sigue estos pasos:</p>

        <h2>Recarga forzada</h2>
        <ol>
          <li>Pulsa <code>Ctrl + Shift + R</code> (Windows/Linux) o <code>Cmd + Shift + R</code> (Mac).</li>
        </ol>

        <h2>Borrar caché manualmente</h2>
        <ol>
          <li>Abre el menú (☰) → <b>Configuración</b>.</li>
          <li>Ve a <b>Privacidad y seguridad</b>.</li>
          <li>En la sección <b>Cookies y datos del sitio</b> pulsa <b>Limpiar datos...</b></li>
          <li>Marca <b>Contenido web en caché</b> y pulsa <b>Limpiar</b>.</li>
        </ol>

        <h2>Borrar Service Worker</h2>
        <ol>
          <li>Escribe en la barra de direcciones: <code>about:serviceworkers</code></li>
          <li>Busca la URL de la aplicación y pulsa <b>Unregister</b>.</li>
          <li>Recarga la página.</li>
        </ol>

        <p className="note">💡 También puedes usar <code>about:devtools-toolbox</code> → Almacenamiento para inspeccionar y borrar la caché del sitio.</p>
      </div>
    ),
  },
  {
    id: "safari",
    label: "🧭 Mac — Safari",
    content: (
      <div>
        <p>En Safari para Mac, la caché de la PWA se borra así:</p>

        <h2>Recarga forzada</h2>
        <ol>
          <li>Pulsa <code>Cmd + Option + R</code> para recargar sin caché.</li>
        </ol>

        <h2>Vaciar caché (menú Desarrollo)</h2>
        <ol>
          <li>Si no ves el menú <b>Desarrollo</b>, actívalo: <b>Safari</b> → <b>Preferencias</b> → <b>Avanzado</b> → marca <b>"Mostrar el menú Desarrollo"</b>.</li>
          <li>Haz clic en <b>Desarrollo</b> → <b>Vaciar cachés</b>.</li>
          <li>Recarga la página.</li>
        </ol>

        <h2>Borrar datos del sitio</h2>
        <ol>
          <li><b>Safari</b> → <b>Preferencias</b> → <b>Privacidad</b>.</li>
          <li>Pulsa <b>Gestionar datos de sitios web...</b></li>
          <li>Busca el dominio de la aplicación y pulsa <b>Eliminar</b>.</li>
        </ol>

        <p className="note">⚠️ Si tienes la app añadida al Dock desde Safari, elimínala y vuelve a añadirla con el menú Archivo → Añadir a Dock.</p>
      </div>
    ),
  },
];

export function HelpCache() {
  const [activeTab, setActiveTab] = useState(0);
  const { t } = useTranslation();

  return (
    <div className="VersionCheckHelp">
      <a href={ROUTES.HOME} className="HelpCache__home">
        <img src={icoHome} alt="" />
        {t('components.version_check.help_back')}
      </a>
      <h1>{t('components.version_check.help_title')}</h1>
      <p>
        {t('components.version_check.help_description')}
      </p>

      <div className="HelpCache__tabs">
        {HELP_TABS.map((tab, i) => (
          <button
            key={tab.id}
            className={"HelpCache__tab" + (activeTab === i ? " HelpCache__tab--active" : "")}
            onClick={() => setActiveTab(i)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="HelpCache__content">
        {HELP_TABS[activeTab].content}
      </div>

      <p className="note">{t('components.version_check.help_after')}</p>
    </div>
  );
} 