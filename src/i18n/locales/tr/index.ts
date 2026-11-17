import appMsg from './appMsg';
import chat from './chat';
import customerAuto from './customerAuto';
import repairmanAuto from './repairmanAuto';
import repairmanMsg from './repairmanMsg';
import sellerAuto from './sellerAuto';
import sellerMsg from './sellerMsg';
import customerMsg from './customerMsg';
import common from './common';
import glossary from './glossary';
import modals from './modals';
import profile from './profile';
import seller from './seller';
import shell from './shell';

const tr = { ...glossary, ...common, ...shell, ...chat, ...profile, ...modals, ...seller, ...customerAuto, ...customerMsg, ...repairmanAuto, ...repairmanMsg, ...sellerAuto, ...sellerMsg, ...appMsg };

export default tr;
