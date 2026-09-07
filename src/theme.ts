export const colors = {
  background: '#F8F7F3', surface: '#FFFFFF', ink: '#232D28', muted: '#738077',
  primary: '#386750', soft: '#E8EFE8', border: '#E3E6DF', danger: '#AB4343',
};
export const typeMeta = {
  note: { label: 'Note', icon: 'document-text-outline', color: '#526B94', background: '#EDF1F8' },
  task: { label: 'Task', icon: 'checkbox-outline', color: '#386750', background: '#E8EFE8' },
  reminder: { label: 'Reminder', icon: 'notifications-outline', color: '#9A712E', background: '#FAF0DA' },
  shopping: { label: 'Shopping', icon: 'bag-handle-outline', color: '#97658A', background: '#F6EDF3' },
} as const;
