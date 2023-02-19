// SCSS
// import '../../scss/index';

// JS
import {sayHi, sayBye} from '../base/popup';
import {global} from '../modules/global';
import {test} from '../modules/test';

let nodeVideoWrapper = document.getElementsByClassName('header__video-wrapper')[0];
let nodeVideo = document.getElementsByClassName('header__video')[0];

nodeVideoWrapper.addEventListener('click', function(e) {
  console.log(nodeVideo.pause, nodeVideo.play);
  nodeVideo.paused ? nodeVideo.play() : nodeVideo.pause();
});
