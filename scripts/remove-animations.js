/**
 * Script pour retirer toutes les animations du rapport interactif
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/PremiumReportView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Remplacer tous les motion.* par des éléments normaux
content = content.replace(/motion\.div/g, 'div');
content = content.replace(/motion\.button/g, 'button');
content = content.replace(/motion\.a/g, 'a');
content = content.replace(/motion\.span/g, 'span');

// Retirer tous les props d'animation
content = content.replace(/\s+initial=\{[^}]*\}/g, '');
content = content.replace(/\s+animate=\{[^}]*\}/g, '');
content = content.replace(/\s+transition=\{[^}]*\}/g, '');
content = content.replace(/\s+whileHover=\{[^}]*\}/g, '');
content = content.replace(/\s+whileTap=\{[^}]*\}/g, '');

// Retirer les classes d'animation et transition
content = content.replace(/\s+hover:[^\s"]*/g, '');
content = content.replace(/\s+transition-[^\s"]*/g, '');
content = content.replace(/\s+duration-[^\s"]*/g, '');
content = content.replace(/\s+ease-[^\s"]*/g, '');

// Retirer les key="..." des motion.div qui restent
content = content.replace(/\s+key="[^"]*"/g, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Animations retirées avec succès');

