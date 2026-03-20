
import ExpandingLogo from "../components/activeLogos/ExpandingLogo/ExpandingLogo"

import { PERMISSIONS_ADMIN, PERMISSIONS_SUPER } from "../permissions";

// ICONS
import userIcon from "../assets/icons/actions/user.svg"
import icoLogout from "../assets/icons/actions/logout.svg"
import bikeIcon from "../assets/icons/actions/bike.svg"
import icoUsers from "../assets/icons/actions/users.svg"
import icoAdmin from "../assets/icons/actions/gear.svg"
import icoCrown from "../assets/icons/actions/crown.svg"
import icoWorkspaces from "../assets/icons/actions/workspaces.svg"

// PAGES
import Login from "../pages/auth/Login/Login";
import Signup from "../pages/auth/Signup/Signup";
import Dashboard from "../pages/Dashboard/Dashboard";
import Users from "../pages/Users/Users";
import SuperDashboard from "../pages/SuperDashboard/SuperDashboard";
import Validate from "../pages/auth/Validate/Validate";
import Profile from "../pages/Profile/Profile";
import AdminPanel from "../pages/AdminPanel/AdminPanel";
import SuperBikeFleet from "../pages/SuperDashboard/SuperBikeFleet/SuperBikeFleet";
import ForgotPassword from "../pages/auth/ForgotPassword/ForgotPassword";
import { HelpCache } from "../components/VersionCheck/VersionCheck";



const PLANS = {
  PRO: 5,
  MID: 3,
  FREE: 1
}

/**
 * The difference between ROUTES and PAGES is:
 *  - ROUTE is a path in the explorer
 *  - PAGE is a component that is rendered in the path
 * 
 * same page can appear in different routes 
 */


export const ROUTES = {
  HELP: '/help',
  HOME:"/",
  USERS:"/usuarios",
  ADMIN:"/admin",
  SUPER_DASHBOARD: '/super',
  PROFILE: '/perfil',
  LOGIN: '/login',
  RESET_PASSWORD: '/resetPassword',
  SIGNUP: '/signup',
  VALIDATE: '/validate',
  ACTIVATE: '/activate',

  DASHBOARD: '/dashboard',
  POINTS_LISTS: '/lists',


  WORKSPACES: '/workspaces',
  WORKSPACES_DETAIL: '/workspaces/:workspace_id',
  INVITATION: '/invitation/:token',
}



export const PAGES = {
  ASSIGN_BIKE: "ASSIGN_BIKE",
}



import i18n from '../i18n/i18n';
import Workspaces from "../pages/Workspaces/Workspaces";
import WorkspaceDetail from "../pages/Workspaces/WorkspaceDetail";
import InvitationLanding from "../pages/auth/InvitationLanding/InvitationLanding";


const titles = {
  [ROUTES.USERS]:{ca: "Usuaris", es: "Usuarios", en: "Users"},
  [ROUTES.ADMIN]:{ca: "Panell Admin", es: "Panel Admin", en: "Admin Panel"},
  [ROUTES.SUPER_DASHBOARD]:{ca: "Super Dashboard", es: "Super Dashboard", en: "Super Dashboard"},
  [ROUTES.PROFILE]:{ca: "Perfil", es: "Perfil", en: "Profile"},
}

export function getNavbar(name, logout, permissions, customCompany = ""){

  const plan = PLANS.PRO // get this from user data
  permissions = PERMISSIONS_ADMIN

  const navbar = [
    {
      path: ROUTES.HELP,
      routerElement: <HelpCache/>,
      isProtected:false,
      noNavbar:true,
    },



    {
      ico: <ExpandingLogo />,
      path: ROUTES.HOME,
      type: "logo",
      isFooter:false,
      routerElement: <Dashboard/>,
      isProtected:true
    },
    {
      ico: icoUsers,
      text: titles[ROUTES.USERS][i18n.language],
      path: ROUTES.USERS,
      isVisible: () => permissions >= PERMISSIONS_ADMIN, // admin
      isFooter:false,
      routerElement: <Users/>,
      isProtected:true
    },
    {
      ico: icoAdmin,
      text: titles[ROUTES.ADMIN][i18n.language],
      path: ROUTES.ADMIN,
      isVisible: () => permissions >= PERMISSIONS_ADMIN, // admin
      isFooter:false,
      routerElement: <AdminPanel/>,
      isProtected:true
    },
    {
      ico: icoCrown,
      text: titles[ROUTES.SUPER_DASHBOARD][i18n.language],
      path: ROUTES.SUPER_DASHBOARD,
      isVisible: () => permissions >= PERMISSIONS_SUPER, // super user
      subOptions: [
        { 
          text: "Bike Fleet", 
          path: "fleet", 
          ico: bikeIcon, 
          routerElement: <SuperBikeFleet/> ,
          isProtected:true
        },
        // { text: "Actividades", path: "/vehicles/actividades", ico: bikeIcon},
      ],
      routerElement: <SuperDashboard/>,
      isProtected:true,
      isFooter:false,
    },


    //APP
    {
      ico: icoWorkspaces,
      text: "Workspaces",
      path: ROUTES.WORKSPACES,
      isVisible: () => (Boolean(plan => PLANS.PRO)), // pro plan
      routerElement: <Workspaces/>,
      isProtected:true,
      isFooter:false,
    },
    {
      path: ROUTES.WORKSPACES_DETAIL,
      routerElement: <WorkspaceDetail/>,
      isProtected:true,
      noNavbar:true,
    },
    {
      path: ROUTES.INVITATION,
      routerElement: <InvitationLanding/>,
      isProtected:false,
      noNavbar:true,
    },















    
  
    //FOOTER
    {
      ico: userIcon,
      text: name,
      path: ROUTES.PROFILE,
      isFooter:true,
      routerElement: <Profile/>,
      isProtected:true
    }, {
      ico: icoLogout,
      text: "Cerrar sesión",
      onClick: logout,
      isFooter:true
    },



    // HIDDEN ROTUES (not in the navbar)
    {
      path: ROUTES.LOGIN,
      routerElement: <Login />,
      forceUnlog:true,
      noNavbar:true,
    },
    {
      path: ROUTES.RESET_PASSWORD,
      routerElement: <ForgotPassword />,
      forceUnlog:true,
      noNavbar:true,
    },
    {
      path: ROUTES.SIGNUP,
      routerElement: <Signup />,
      forceUnlog:true,
      noNavbar:true,
    },{
      path: ROUTES.VALIDATE,
      routerElement: <Validate />,
      forceUnlog:true,
      noNavbar:true,
    },
    {
      path: `${ROUTES.VALIDATE}/:token/:email`,
      routerElement: <Validate />,
      forceUnlog:true,
      noNavbar:true,
    },
    {
      path: ROUTES.ACTIVATE,
      routerElement: <Validate activate/>,
      forceUnlog:true,
      noNavbar:true,
    },
    {
      path: `${ROUTES.ACTIVATE}/:token/:email`,
      routerElement: <Validate activate/>,
      forceUnlog:true,
      noNavbar:true,
    },
  ]

  return navbar
}
 
