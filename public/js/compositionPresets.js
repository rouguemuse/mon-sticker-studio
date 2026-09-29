/**
 * compositionPresets.js
 * Automatically positions Human and Creature layers into standard duo presets
 * Both layers remain completely independent and editable!
 */

export function applyDuoPreset(presetName, humanLayer, creatureLayer) {
  if (!humanLayer || !creatureLayer) return;

  // Reset basic scales and rotations
  humanLayer.rotation = 0;
  creatureLayer.rotation = 0;

  switch (presetName) {
    case 'shoulder':
      // Person centered lower; Creature perched on shoulder
      humanLayer.x = 240;
      humanLayer.y = 310;
      humanLayer.scale = 0.85;

      creatureLayer.x = 350;
      creatureLayer.y = 190;
      creatureLayer.scale = 0.48;
      creatureLayer.rotation = -8;
      break;

    case 'in_arms':
      // Person centered; Creature held in front
      humanLayer.x = 256;
      humanLayer.y = 290;
      humanLayer.scale = 0.85;

      creatureLayer.x = 256;
      creatureLayer.y = 330;
      creatureLayer.scale = 0.52;
      break;

    case 'head':
      // Person lower; Creature balanced right on top of head
      humanLayer.x = 256;
      humanLayer.y = 340;
      humanLayer.scale = 0.82;

      creatureLayer.x = 256;
      creatureLayer.y = 135;
      creatureLayer.scale = 0.42;
      break;

    case 'behind':
      // Creature peeking from behind human's left shoulder
      humanLayer.x = 280;
      humanLayer.y = 300;
      humanLayer.scale = 0.85;

      creatureLayer.x = 160;
      creatureLayer.y = 210;
      creatureLayer.scale = 0.46;
      creatureLayer.rotation = 12;
      break;

    case 'hugging':
      // Creature hugging person's neck/torso
      humanLayer.x = 230;
      humanLayer.y = 290;
      humanLayer.scale = 0.85;

      creatureLayer.x = 315;
      creatureLayer.y = 260;
      creatureLayer.scale = 0.50;
      creatureLayer.rotation = -15;
      break;

    case 'attacking':
      // Playfully jumping onto person's head/face
      humanLayer.x = 230;
      humanLayer.y = 310;
      humanLayer.scale = 0.82;

      creatureLayer.x = 310;
      creatureLayer.y = 160;
      creatureLayer.scale = 0.52;
      creatureLayer.rotation = -25;
      break;

    case 'judging':
      // Side-by-side judging look
      humanLayer.x = 180;
      humanLayer.y = 290;
      humanLayer.scale = 0.78;

      creatureLayer.x = 345;
      creatureLayer.y = 300;
      creatureLayer.scale = 0.58;
      break;

    case 'riding':
      // Creature scaled up as a mount, human placed on back
      creatureLayer.x = 256;
      creatureLayer.y = 340;
      creatureLayer.scale = 0.95;

      humanLayer.x = 256;
      humanLayer.y = 160;
      humanLayer.scale = 0.55;
      break;

    default:
      // Duo side-by-side
      humanLayer.x = 190;
      humanLayer.y = 290;
      humanLayer.scale = 0.8;

      creatureLayer.x = 340;
      creatureLayer.y = 290;
      creatureLayer.scale = 0.6;
      break;
  }
}
