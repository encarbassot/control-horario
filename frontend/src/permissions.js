const PERMISSIONS = {
  "user":0,
  "admin":3,
  "super":5,
}



export default PERMISSIONS
export const PERMISSIONS_NAMES = Object.keys(PERMISSIONS)
export const PERMISSIONS_VALUES = Object.values(PERMISSIONS)

export function getPermisionsEqualLower(input){
  
  if (typeof input === "number") {
    
    return Object.fromEntries(
      Object.entries(PERMISSIONS).filter(([_, value]) => value <= input)
      )
    } else if (typeof input === "string") {
    const value = PERMISSIONS[input]
    if (value === undefined) {
      throw new Error(`Invalid permission key: ${input}`)
    }
    return Object.fromEntries(
      Object.entries(PERMISSIONS).filter(([_, v]) => v <= value)
    )
  }

  return {}
}


export const PERMISSIONS_SUPER = PERMISSIONS["super"]
export const PERMISSIONS_ADMIN = PERMISSIONS["admin"]
export const PERMISSIONS_USER = PERMISSIONS["user"]

export const PERMISSIONS_TO_CREATE_BIKES = PERMISSIONS_ADMIN
