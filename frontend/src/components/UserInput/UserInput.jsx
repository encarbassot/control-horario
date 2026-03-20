import React, { useState } from "react";
import PropTypes from "prop-types";
import "./UserInput.css";
import AssignForModal from "../../pages/Assignments/AssignForModal";
import { useElioAuth } from "../contexts/ElioAuthContext";
import { useTranslation } from 'react-i18next';

export default function UserInput({ 
  selectedUser, 
  onSubmit,
  text ="",
}){

  const { user } = useElioAuth()
  const email = user?.email || ""
  const { t } = useTranslation()

  const label = selectedUser ? (
    selectedUser.email === email ? `(yo) ${selectedUser.email}` : selectedUser.email
  ) : `(yo) ${email}`

  const [isModalOpen, setIsModalOpen] = useState(false)

  return (<>
  {
    isModalOpen &&
      <AssignForModal  
        setIsOpen={setIsModalOpen} 
        submit={onSubmit} 
        selectedUser={selectedUser}
      />
  }

      <div className="adminActions userinput-inner">
        <span>
          {text || t('components.user_input.assign_for')}
          <button 
            className="button admin user-input-button" 
            onClick={()=>setIsModalOpen(true)}
          >
            <b>{label}</b>
          </button>
        </span>
      </div>

  </>
  )
}

