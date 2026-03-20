import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import { api } from "../../api/ApiAdapter"
import ButtonModal from "../../elio-react-components/components/Modals/ButtonModal/ButtonModal"
import ElioForm from "../../elio-react-components/components/ElioForm/ElioForm"

import { ElioModel, ElioField } from "elioapi/frontend"
import { Workspace as WorkspaceFactory } from "../../../../models/Workspace.js"
import { ROUTES } from "../../routes/navigationConfig"

const WorkspaceModel = WorkspaceFactory(ElioModel, ElioField)

const ROLE_COLORS = {
  owner:   "bg-purple-100 text-purple-700",
  admin:   "bg-blue-100 text-blue-700",
  manager: "bg-indigo-100 text-indigo-700",
  worker:  "bg-green-100 text-green-700",
  viewer:  "bg-gray-100 text-gray-500",
}

export default function Workspaces() {
  const navigate = useNavigate()
  const [workspaces, setWorkspaces] = useState([])
  const [values, setValues] = useState({})

  useEffect(() => {
    api.get("/workspaces").then(({ success, data }) => {
      if (success) setWorkspaces(data)
    })
  }, [])

  async function handleCreate() {
    const { success, data } = await api.post("/workspaces", values)
    if (success) setWorkspaces(prev => [...prev, data])
  }

  return (
    <div className="Page">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workspaces</h1>
          <p className="text-sm text-gray-500 mt-1">{workspaces.length} workspace{workspaces.length !== 1 ? "s" : ""}</p>
        </div>
        <ButtonModal
          buttonClassName="button"
          buttonContent="+ New workspace"
          aceptar={handleCreate}
        >
          <ElioForm
            values={values}
            onChange={setValues}
            model={WorkspaceModel}
            fields={["name", "description"]}
          />
        </ButtonModal>
      </div>

      {/* List */}
      {workspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="text-5xl mb-4">🏢</span>
          <p className="text-gray-500 text-lg font-medium">No workspaces yet</p>
          <p className="text-gray-400 text-sm mt-1">Create your first workspace to get started</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map(ws => (
            <div
              key={ws.id}
              onClick={() => navigate(ROUTES.WORKSPACES_DETAIL.replace(':workspace_id', ws.id))}
              className="group relative bg-white rounded-2xl border border-gray-100 p-5 cursor-pointer
                         shadow-sm hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5
                         transition-all duration-150"
            >
              {/* Role badge */}
              <span className={`absolute top-4 right-4 text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[ws.role] || "bg-gray-100 text-gray-500"}`}>
                {ws.role}
              </span>

              {/* Icon + Name */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600
                                flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {ws.name?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-gray-900 truncate">{ws.name}</h2>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-400 line-clamp-2 min-h-[2.5rem]">
                {ws.description || "No description"}
              </p>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Created {new Date(ws.created_at).toLocaleDateString()}
                </span>
                <span className="text-blue-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Open →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

