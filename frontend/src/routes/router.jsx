import { createBrowserRouter, Navigate } from "react-router-dom"
import { getNavbar, ROUTES } from "./navigationConfig"
import ProtectedRoute from "./ProtectedRoute"
import Layout from "../Layout"
import Login from "../pages/auth/Login/Login"
import { useElioAuth } from "../contexts/ElioAuthContext"
import RouteError from "../components/RouteError/RouteError"

const UnloggedRoute = ({children}) => {
  const { isLoggedIn } = useElioAuth()

  if(isLoggedIn){
    return <Navigate to={ROUTES.HOME} />
  }

  return children
}






function getRouterObject(op,forceUnlog=false){
  const element = forceUnlog ? <UnloggedRoute>{op.routerElement}</UnloggedRoute> : op.routerElement
  return { element, path: op.path}
}


export function getRouter(){
  const navbar = getNavbar()

  //flatten navbar
  for (const op of navbar) {

    if(op.subOptions && op.subOptions.length>0){
      for (const subOp of op.subOptions) {
        if(!subOp.path.startsWith("/")){
          subOp.path = `${op.path}/${subOp.path}`
        }
        navbar.push(subOp)
      }
    }

  } 

  const protectedRoute = navbar.filter(x=>x.isProtected)
  const forceUnlog = navbar.filter(x=>x.forceUnlog)
  const elseRoute = navbar.filter(x=>!x.isProtected && !x.forceUnlog)

  const router = createBrowserRouter([
    {
      path: '/',
      element: <ProtectedRoute
        loggedInComponent={Layout}
        notLoggedInComponent={Login}
      />,
      errorElement: <RouteError />,
      children: protectedRoute.map(x=>getRouterObject(x))
    },
    ...elseRoute.map(x=>getRouterObject(x)),
    ...forceUnlog.map(x=>getRouterObject(x,true))
  ])

  return router
}