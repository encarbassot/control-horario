import { useState } from "react";
import PropTypes from "prop-types";
import "./UserCard.css";

export default function UserCard({ user, onClick, onClickText=undefined, showLabel=false }){
  if(!user) return null

  const displayName = user.name || user.fullName || user.email || "Anonymous"

  return (
    <div className="user-card-wrapper">
      <div className={"user-card-label" + (showLabel ? " show-label" : "")} onClick={onClick} role={onClick?"button":"presentation"}>
        {displayName}
      </div>


        <div className="user-card-floating">
          <div className="uc-row"><strong>Name:</strong> <span>{user.name ?? user.fullName ?? "-"}</span></div>
          {user.email && <div className="uc-row"><strong>Email:</strong> <a href={"mailto:"+user.email}>{user.email}</a></div>}
          {user.phone && <div className="uc-row"><strong>Phone:</strong> <a href={"tel:"+user.phone}>{user.phone}</a></div>}
          {/* {user.id && <div className="uc-row"><strong>ID:</strong> <span>{user.id}</span></div>} */}
          {user.company && <div className="uc-row"><strong>Company:</strong> <span>{user.company}</span></div>}
          {user.extra && <div className="uc-row"><strong>Info:</strong> <pre className="uc-pre">{JSON.stringify(user.extra, null, 2)}</pre></div>}
          {onClick && <div className="uc-action">{onClickText || "Click to filter by this user"}</div>}
        </div>

    </div>
  )
}

UserCard.propTypes = {
  user: PropTypes.object.isRequired,
  onClick: PropTypes.func
}
