const { exec } = require('child_process');

const ports = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010, 3011, 3012, 3013, 3014, 3015];

console.log('🚀 Iniciando servidores Next.js...');

ports.forEach(port => {
  const command = `npx next dev -p ${port}`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.log(`❌ Error en puerto ${port}: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`⚠️  Puerto ${port}: ${stderr}`);
      return;
    }
    console.log(`✅ Servidor en puerto ${port} iniciado`);
  });
  
  // Pequeño delay entre cada inicio
  setTimeout(() => {}, 1000);
});
