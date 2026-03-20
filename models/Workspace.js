export const Workspace = (ElioModel, ElioField) => new ElioModel("workspace", {
  name:        ElioField.string().required().public(),
  description: ElioField.string().optional().public(),
  created_by:  ElioField.string().required().public(), // user_id of the owner
})
