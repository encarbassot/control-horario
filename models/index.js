// models/index.js
// Shared model factory – single source of truth for the data schema.
// Models are factories (ElioModel, ElioField) => ElioModel instance so this
// directory has zero dependencies on elioapi, which may not be installed here.
//
// Usage in api/:
//   import { ElioModel, ElioField } from 'elioapi'
//   import { createModels } from '../models/index.js'
//   const { User, Workspace, ... } = createModels(ElioModel, ElioField)

import { User }            from './User.js';
import { Workspace }       from './Workspace.js';
import { WorkspaceMember } from './WorkspaceMember.js';
import { WorkSchedule }    from './WorkSchedule.js';
import { ShiftEvent }      from './ShiftEvent.js';
import { WorkspaceConfig } from './WorkspaceConfig.js';
import { Invitation }      from './Invitation.js';
import { ScheduleTemplate } from './ScheduleTemplate.js';

export function createModels(ElioModel, ElioField) {
  return {
    User:            User(ElioModel, ElioField),
    Workspace:       Workspace(ElioModel, ElioField),
    WorkspaceMember: WorkspaceMember(ElioModel, ElioField),
    WorkSchedule:    WorkSchedule(ElioModel, ElioField),
    ShiftEvent:      ShiftEvent(ElioModel, ElioField),
    WorkspaceConfig: WorkspaceConfig(ElioModel, ElioField),
    Invitation:        Invitation(ElioModel, ElioField),
    ScheduleTemplate:  ScheduleTemplate(ElioModel, ElioField),
  }
}
