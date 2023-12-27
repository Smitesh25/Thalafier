class TextProcessor extends HTMLElement {
  constructor() {
    super();
    this.isChangingBackground = false;
    this.isInputBoxCleared = false;
  }

  connectedCallback() {
    this.loadTemplate('text-processor-template.html', () => {
      const inputBox = this.querySelector('#myInput');
      inputBox.addEventListener('click', () => this.clearInputBox());
      inputBox.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.processText();
        }
      });
      inputBox.addEventListener('input', () => this.resizeInput());
    });
  }

  changeBackgroundToVideo() {
    document.querySelector('.container').style.backgroundImage = 'none';

    const { updatedValue, newVideoSource, audioSource } = this.computeUpdatedValue();
    this.updateInputBox(updatedValue, true);

    const videoElement = this.createVideoElement(newVideoSource, audioSource);
    const muteButton = this.createMuteButton(videoElement);

    const container = document.querySelector('.container');
    container.appendChild(videoElement);
    document.getElementById('muteButtonContainer').appendChild(muteButton);
  }

  createVideoElement(videoSource, audioSource) {
    const videoElement = document.createElement('video');
    videoElement.src = videoSource;
    videoElement.autoplay = true;
    videoElement.loop = true;
    videoElement.muted = false;
    videoElement.style = `
      width: 100vw;
      height: 100vh;
      object-fit: cover;
      position: fixed;
      top: 0;
      left: 0;
      z-index: -1;
    `;

    if (audioSource) {
      const audioElement = this.createAudioElement(audioSource);
      videoElement.appendChild(audioElement);
    }

    return videoElement;
  }

  createAudioElement(audioSource) {
    const audioElement = document.createElement('audio');
    audioElement.src = audioSource;
    audioElement.autoplay = true;
    audioElement.loop = true;
    audioElement.muted = false;
    audioElement.style = `
      display: none; // hide the audio element
    `;
    return audioElement;
  }

  createMuteButton(videoElement) {
    const muteButton = document.createElement('button');
    muteButton.innerHTML = '<span id="speakerIcon">🔊</span>';
    muteButton.style = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      z-index: 100;
      height: 3vh;
      width: 3vw;
    `;
    muteButton.addEventListener('click', () => this.toggleMute(videoElement));
    return muteButton;
  }

  toggleMute(videoElement) {
    videoElement.muted = !videoElement.muted;

    const audioElement = videoElement.querySelector('audio');
    if (audioElement) {
      audioElement.muted = !audioElement.muted;
    }

    const muteButton = document.getElementById('muteButtonContainer').querySelector('button');
    muteButton.classList.toggle('muted', videoElement.muted);
  }

  updateInputBox(value, readOnly) {
    const inputBox = this.querySelector('#myInput');
    inputBox.value = value;
    inputBox.readOnly = readOnly;
    inputBox.style = `
      background-color: transparent;
      color: #fff;
    `;
    this.resizeInput();
  }

  clearInputBox() {
    const inputBox = this.querySelector('#myInput');
    if (!this.isInputBoxCleared) {
      inputBox.value = '';
      this.isInputBoxCleared = true;
    }
  }

  computeUpdatedValue() {
    const currentValue = this.querySelector('#myInput').value;
    const { explanation, isThalafied } = this.getResult(currentValue);
    const updatedValue = explanation;

    let filename, audioFileName;
    if (isThalafied) {
      filename = 'thala';
    } else {
      filename = 'gambhir97';
      audioFileName = 'moye';
    }
    const newVideoSource = `/media/${filename}.mp4`;
    const audioSource = `/media/${audioFileName}.mp3`;

    return { updatedValue, newVideoSource, audioSource };
  }

  getResult(input) {
    const removeSpaces = input.replace(/\s/g, '');
    let sum = 0;
    let explanationSteps = [];
    let numArr = [];
    let charArr = [];
    let numAdditionStep = '';
    let charAdditionStep = '';
    let charCount = 0;
    let numCount = 0;

    for (let char of removeSpaces) {
      if (!isNaN(char)) {
        numArr.push(char);
      } else {
        charArr.push(char);
      }
    }

    for (let char of charArr) {
      charCount += 1;
      charAdditionStep += char;
      charAdditionStep += ' + ';
    }
    if (charAdditionStep.length > 1) {
      charAdditionStep = charAdditionStep.slice(0, -3);
      charAdditionStep += ' = ';
      charAdditionStep += charCount.toString();
    }
    for (let char of numArr) {
      numCount += parseInt(char);
      numAdditionStep += char;
      numAdditionStep += ' + ';
    }
    if (numAdditionStep.length > 1) {
      numAdditionStep = numAdditionStep.slice(0, -3);
      numAdditionStep += ' = ';
      numAdditionStep += numCount.toString();
    }

    if (charAdditionStep) explanationSteps.push(charAdditionStep);
    if (numAdditionStep) explanationSteps.push(numAdditionStep);
    sum += numCount + charCount;

    if (charAdditionStep && numAdditionStep) {
      explanationSteps.push(`${charCount} + ${numCount} = ${sum}`);
    }

    while (sum >= 10) {
      const digits = sum.toString().split('').map(digit => parseInt(digit));
      let tmpExplanation = '';
      const newSum = digits.reduce((acc, digit) => {
        tmpExplanation += digit;
        tmpExplanation += ' + ';
        return acc + digit;
      }, 0);
      if (tmpExplanation.length > 1) {
        tmpExplanation = tmpExplanation.slice(0, -3);
        tmpExplanation += ' = ';
        tmpExplanation += newSum.toString();
      }
      explanationSteps.push(tmpExplanation);
      sum = newSum;
    }
    const arrowSymbol = '\u2192';
    const bigArrowSymbol = '\u2794';
    const result = sum === 7 ? 'THALAFIED' : 'MOYE MOYE';
    const isThalafied = sum === 7;
    const explanation = `${input} ${bigArrowSymbol} [ ${explanationSteps.join(` ${arrowSymbol} `)} ] ${bigArrowSymbol} ${result}`;
    return { explanation, isThalafied };
  }

  processText() {
    this.changeBackgroundToVideo();
  }

  resizeInput() {
    const inputBox = this.querySelector('#myInput');
    inputBox.style.width = 'auto';

    const maxWidth = window.innerWidth * 0.7;
    const newWidth = Math.min(inputBox.scrollWidth, maxWidth);
    inputBox.style.width = `${newWidth}px`;
  }

  loadTemplate(templateFile, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', templateFile, true);
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          this.innerHTML = xhr.responseText;
          if (typeof callback === 'function') {
            callback();
          }
        } else {
          console.error('Template loading failed');
        }
      }
    };
    xhr.send();
  }
}

customElements.define('text-processor', TextProcessor);
