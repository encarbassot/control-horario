




// export function formatDuration(seconds) {
//   const units = [
//     { label: 'semana', seconds: 60 * 60 * 24 * 7 },
//     { label: 'dia', seconds: 60 * 60 * 24 },
//     { label: 'hora', seconds: 60 * 60 },
//     { label: 'minuto', seconds: 60 },
//     { label: 'segundo', seconds: 1 }
//   ];

//   let remainingSeconds = seconds;
//   const result = [];

//   units.forEach(unit => {
//     const unitCount = Math.floor(remainingSeconds / unit.seconds);
//     if (unitCount > 0) {
//       result.push(`${unitCount} ${unit.label}${unitCount > 1 ? 's' : ''}`);
//       remainingSeconds %= unit.seconds;
//     }
//   });

//   return result.join(' y ');
// }






const maxTimeScales = [
  { name: "minutos", seconds: 60 },
  { name: "horas", seconds: 3600 },
  { name: "días", seconds: 86400 },
  { name: "semanas", seconds: 604800 },
  { name: "meses", seconds: 2629800 },
  { name: "años", seconds: 31557600 }
];

export const convertSecondsToScale = (seconds, options = {}) => {
  const { 
    timeScales = maxTimeScales,
    ERROR_MARGIN = 0.1,
    outputString = false
  } = options;

  let chosenScale = timeScales[0];
  let amount = seconds / chosenScale.seconds;

  for (let i = 1; i < timeScales.length; i++) {
    const scale = timeScales[i];
    const newAmount = seconds / scale.seconds;
    const roundedAmount = Math.round(newAmount);
    const error = Math.abs(newAmount - roundedAmount) / roundedAmount;
    
    if (newAmount >= 1 && error <= ERROR_MARGIN) {
      chosenScale = scale;
      amount = roundedAmount;
    } else if (i === timeScales.length - 1 && newAmount >= 0.9) {
      chosenScale = scale;
      amount = 1;
    } else {
      break;
    }
  }

  if(outputString){
    return `${Math.round(amount)} ${chosenScale.name}`;
  }

  return { amount: Math.round(amount), scale: chosenScale.name };
};














export function getUserPlaceholder(){
  const usuarios = [
    { name: "Juan Pérez", email: "juan.perez@example.com" },
    { name: "María García", email: "maria.garcia@example.com" },
    { name: "Carlos Rodríguez", email: "carlos.rodriguez@example.com" },
    { name: "Ana López", email: "ana.lopez@example.com" },
    { name: "Miguel Fernández", email: "miguel.fernandez@example.com" },
    { name: "Laura Martínez", email: "laura.martinez@example.com" },
    { name: "José Sánchez", email: "jose.sanchez@example.com" },
    { name: "Carmen Ramírez", email: "carmen.ramirez@example.com" },
    { name: "David Torres", email: "david.torres@example.com" },
    { name: "Patricia Díaz", email: "patricia.diaz@example.com" },
    { name: "Alejandro Gómez", email: "alejandro.gomez@example.com" },
    { name: "Lucía Morales", email: "lucia.morales@example.com" },
    { name: "Francisco Herrera", email: "francisco.herrera@example.com" },
    { name: "Isabel Castro", email: "isabel.castro@example.com" },
    { name: "Ricardo Méndez", email: "ricardo.mendez@example.com" },
    { name: "Sofía Ortega", email: "sofia.ortega@example.com" },
    { name: "Andrés Vargas", email: "andres.vargas@example.com" },
    { name: "Verónica Jiménez", email: "veronica.jimenez@example.com" },
    { name: "Raúl Romero", email: "raul.romero@example.com" },
    { name: "Elena Navarro", email: "elena.navarro@example.com" }
  ]


  const index = Math.floor(Math.random() * usuarios.length)
  return usuarios[index]
}