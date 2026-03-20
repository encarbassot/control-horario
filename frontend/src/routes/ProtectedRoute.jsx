import { Navigate } from "react-router-dom"

import { ROUTES } from "./navigationConfig"
import { useElioAuth } from "../contexts/ElioAuthContext.jsx"

const ProtectedRoute = ({children, protectIfLogged=false, loggedInComponent: LoggedInComponent, notLoggedInComponent: NotLoggedInComponent }) => {

  const { isLoggedIn, isCheckingAuth } = useElioAuth()
  
  // Wait silently while the auto-login cookie check is in-flight.
  // This prevents an instant redirect to /login on page reload.
  if (isCheckingAuth) return null
  // return <h1>16</h1>

  if( LoggedInComponent && NotLoggedInComponent){
    return isLoggedIn ? <LoggedInComponent /> : <NotLoggedInComponent />
  }
  
  if(protectIfLogged && isLoggedIn){
    if(NotLoggedInComponent){
      return <NotLoggedInComponent/>
    }
    return <Navigate to={ROUTES.HOME} />
  }

  if(!protectIfLogged && !isLoggedIn){
    if(LoggedInComponent){
      return <LoggedInComponent/>
    }
    return <Navigate to={ROUTES.HOME} />
  }


  return children
}

export default ProtectedRoute











