// Seed data extracted from Entrenamiento.xlsx
// ENTRENAMIENTO sheet → gymSessions
// PROGRESO sheet → progresoData
// DIETA sheet → dietaTargets
// MEDIDAS sheet → medidasData

export const GYM_SESSIONS = ['PUSH', 'LEG1', 'PULL', 'LEG2'];

export const gymSessions = {
  PUSH: {
    exercises: [
      { id: 101, name: 'Press banca',                      sets: 3, reps: '1×6-10 / 2×10-12',       muscleGroup: 'Pecho',    technique: 'RECTA',    weekHistory: ['', '', ''] },
      { id: 102, name: 'Alta inclinación mancuernas',       sets: 3, reps: '1×10-12 / 1×6-9',         muscleGroup: 'Pecho',    technique: 'RECTA',    weekHistory: ['', '', ''] },
      { id: 103, name: 'Aperturas pect polea / máquina',   sets: 3, reps: '1×8-12 / 2×12-15 (DS)',   muscleGroup: 'Pecho',    technique: 'DROP SET', weekHistory: ['', '', ''] },
      { id: 104, name: 'Laterales en polea con tobillera', sets: 2, reps: '1×10-12 / 1×6-9',         muscleGroup: 'Hombros',  technique: 'RECTA',    weekHistory: ['', '', ''] },
      { id: 105, name: 'Laterales sentado',                 sets: 2, reps: '1×8-10 / 1×12-15 (DS)',   muscleGroup: 'Hombros',  technique: 'DROP SET', weekHistory: ['', '', ''] },
      { id: 106, name: 'Tríceps polea cuerdas',             sets: 2, reps: '1×6-10 / 1×10-12',        muscleGroup: 'Tríceps',  technique: 'RECTA',    weekHistory: ['', '', ''] },
      { id: 107, name: 'Katana',                            sets: 2, reps: '2×8-12',                  muscleGroup: 'Tríceps',  technique: 'RECTA',    weekHistory: ['', '', ''] },
    ],
    notes: ''
  },
  LEG1: {
    exercises: [
      { id: 108, name: 'Gemelo',                  sets: 3, reps: '1×8-10 / 2×10-12',     muscleGroup: 'Piernas',  technique: 'RECTA',    weekHistory: ['130×10 / 120×12 / 120×12', '', ''] },
      { id: 109, name: 'Aductor máquina',         sets: 2, reps: '10-12',                 muscleGroup: 'Piernas',  technique: 'RECTA',    weekHistory: ['45×12 / 50×12', '', ''] },
      { id: 110, name: 'Isquios sentado',         sets: 3, reps: '12-15',                 muscleGroup: 'Piernas',  technique: 'RECTA',    weekHistory: ['40×12 / 40×11 / 40×9', '', ''] },
      { id: 111, name: 'Cuádriceps unilateral',   sets: 3, reps: '10-12',                 muscleGroup: 'Piernas',  technique: 'RECTA',    weekHistory: ['25×12 / 30×10 / 30×10', '', ''] },
      { id: 112, name: 'Hack squat pausa abajo',  sets: 2, reps: '1×8-11 / 1×10-12',     muscleGroup: 'Piernas',  technique: 'RECTA',    weekHistory: ['40×8 / 40×8', '', ''] },
      { id: 113, name: 'Búlgaras',                sets: 1, reps: '1×10-12',               muscleGroup: 'Piernas',  technique: 'RECTA',    weekHistory: ['12×10', '', ''] },
    ],
    notes: ''
  },
  PULL: {
    exercises: [
      { id: 114, name: 'Jalón pecho',             sets: 2, reps: '1×8-11 / 1×10-12',       muscleGroup: 'Espalda',  technique: 'RECTA',    weekHistory: ['', '', ''] },
      { id: 115, name: 'Remo prono polea',        sets: 3, reps: '1×8-10 / 2×10-12 (DS)',  muscleGroup: 'Espalda',  technique: 'DROP SET', weekHistory: ['', '', ''] },
      { id: 116, name: 'Remo T',                  sets: 2, reps: '10-12',                   muscleGroup: 'Espalda',  technique: 'RECTA',    weekHistory: ['', '', ''] },
      { id: 117, name: 'Remo unilateral manc.',   sets: 2, reps: '1×6-10 / 1×10-12',       muscleGroup: 'Espalda',  technique: 'RECTA',    weekHistory: ['', '', ''] },
      { id: 118, name: 'Bíceps máquina',          sets: 3, reps: '10-15',                   muscleGroup: 'Bíceps',   technique: 'RECTA',    weekHistory: ['', '', ''] },
      { id: 119, name: 'Bayesian',                sets: 2, reps: '1×8-10 / 1×10-12 (DS)',  muscleGroup: 'Bíceps',   technique: 'DROP SET', weekHistory: ['', '', ''] },
      { id: 120, name: 'Reverse pec deck',        sets: 3, reps: '12',                      muscleGroup: 'Hombros',  technique: 'RECTA',    weekHistory: ['', '', ''] },
    ],
    notes: ''
  },
  LEG2: {
    exercises: [
      { id: 121, name: 'SLDL',                    sets: 3, reps: '10-12',                   muscleGroup: 'Piernas',  technique: 'RECTA',    weekHistory: ['', '', ''] },
      { id: 122, name: 'Isquios sentado',         sets: 3, reps: '1×8-10 / 2×10-12',       muscleGroup: 'Piernas',  technique: 'RECTA',    weekHistory: ['', '', ''] },
      { id: 123, name: 'Extensora cuádriceps',    sets: 3, reps: '1×8-10 / 2×10-12 (DS)',  muscleGroup: 'Piernas',  technique: 'DROP SET', weekHistory: ['', '', ''] },
      { id: 124, name: 'Prensa',                  sets: 2, reps: '1×6-10 / 1×10-12 (DS)',  muscleGroup: 'Piernas',  technique: 'DROP SET', weekHistory: ['', '', ''] },
      { id: 125, name: 'Hip thrust',              sets: 3, reps: '1×10-12 / 2×6-9',        muscleGroup: 'Glúteos',  technique: 'RECTA',    weekHistory: ['', '', ''] },
    ],
    notes: ''
  }
};

