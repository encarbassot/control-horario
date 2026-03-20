import moment from "moment";
import { PAGES } from "../routes/navigationConfig";







export function getErrMsgFromResp(resp, defaultMsg = "Ha ocurrido un error inesperado.", errorFrom = null){
  let errors = [];

  if (!resp || typeof resp !== "object") {
    return { text: defaultMsg, more: [defaultMsg] };
  }


  // Handle high-priority errors from "more"
  if (resp.err?.more) {
    if (typeof resp.err.more === "string") {
      errors.push({ msg: resp.err.more, priority: 2 });
    }else if(Array.isArray(resp.err.more) && resp.err.more.length >= 1){ 
      const first = resp.err.more[0]
      if (typeof first === "string") {
        errors.push({ msg: first, priority: 2 });
      }else if(typeof first === "object") {
        if(first.message && typeof first.message === "string"){
          errors.push({ msg: first.message, priority: 2 });
        }
      }
    }else if (typeof resp.err.more === "object") {

      Object.entries(resp.err.more).forEach(([key, detail]) => {


        if (typeof detail === "string") {
          errors.push({ msg: detail, priority: 2 });
        } else if (typeof detail === "object") {





          // ------------------------ CUSTOM ERROR HANDLING ------------------------

          // "ModalAssignBike.jsx" error handling
          if (errorFrom === PAGES.ASSIGN_BIKE){
            if (detail.bike && detail.startDate && detail.endDate) {
              errors.push({
                msg: `Conflicto: ya tienes asignada la bicicleta #${detail.bike.number} desde ${moment(detail.startDate).format("DD/MM/YYYY HH:mm")} hasta ${moment(detail.endDate).format("DD/MM/YYYY HH:mm")}.`,
                priority: 1
              });
            } else {
              errors.push({
                msg: "Error al asignar bicicleta, ya tienes una asignación en ese rango de fechas.",
                priority: 1
              });
            }
          }


          // -----------------------------------------------------------------------




        }
      });
    }
  }



  if (resp.err?.msg) {
    errors.push({ msg: resp.err.msg, priority: 3 });
  }

  // If no specific errors were found, use the default message
  if (errors.length === 0) {
    errors.push({ msg: defaultMsg, priority: 4 });
  }

    
  errors.sort((a, b) => a.priority - b.priority);

  return {
    text: errors[0].msg,
    more: errors.slice(1).map(e => e.msg),
    all: errors.map(e => e.msg)
  };

}