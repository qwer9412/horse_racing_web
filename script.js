// 게임 상태 관리
let gameState = {
    teams: [],
    currentPositions: [],
    teamCount: 4,
    pixelsPerPoint: 50, // 1점당 50픽셀 고정
    isGameActive: false
};

// localStorage 키
const STORAGE_KEY = 'horseRacingGameState';

// 말 이모지 배열
const horseEmojis = ['🐎', '🏇', '🦓', '🦄', '🐴', '🎠', '🏃', '🦌'];

// 팀 색상 배열
const teamColors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e', '#e67e22'];

// DOM 요소들
const setupScreen = document.getElementById('setup-screen');
const gameScreen = document.getElementById('game-screen');
const teamCountSelect = document.getElementById('team-count');
const startGameBtn = document.getElementById('start-game');
const resetGameBtn = document.getElementById('reset-game');
const newGameBtn = document.getElementById('new-game');
const horsesContainer = document.getElementById('horses-container');
const controlPanel = document.getElementById('control-panel');

// 게임 시작 버튼 클릭 이벤트
startGameBtn.addEventListener('click', initializeGame);

// 리셋 버튼 클릭 이벤트
resetGameBtn.addEventListener('click', resetGame);

// 새 게임 버튼 클릭 이벤트
newGameBtn.addEventListener('click', newGame);

// 게임 초기화
function initializeGame() {
    gameState.teamCount = parseInt(teamCountSelect.value);
    gameState.teams = [];
    gameState.currentPositions = [];
    gameState.isGameActive = true;

    // 팀 생성
    for (let i = 0; i < gameState.teamCount; i++) {
        gameState.teams.push({
            id: i,
            name: `팀 ${i + 1}`,
            emoji: horseEmojis[i % horseEmojis.length],
            color: teamColors[i % teamColors.length]
        });
        gameState.currentPositions[i] = 0; // 모든 팀 0점에서 시작
    }

    // 화면 전환
    setupScreen.classList.remove('active');
    gameScreen.classList.add('active');

    // 게임 화면 렌더링
    renderGame();

    // 상태 저장
    saveGameState();
}

// 게임 화면 렌더링
function renderGame() {
    // 초기 트랙 범위 설정
    checkAndExpandTrack();
    // 말들 렌더링
    renderHorses();
    // 컨트롤 패널 렌더링
    renderControls();

    // 초기 스크롤 위치 설정 (-1이 맨 왼쪽에 보이도록)
    setTimeout(() => {
        const scrollContainer = document.getElementById('track-scroll-container');
        const range = getCurrentRange();
        // -1 위치를 화면 맨 왼쪽에 배치
        const targetPosition = (-1 - range.min) * gameState.pixelsPerPoint;
        scrollContainer.scrollTo({
            left: targetPosition,
            behavior: 'auto' // 초기 로드시에는 즉시 이동
        });
    }, 100);
}

// 말들 렌더링
function renderHorses() {
    horsesContainer.innerHTML = '';

    gameState.teams.forEach((team, index) => {
        const laneDiv = document.createElement('div');
        laneDiv.className = 'horse-lane';

        // 팀 라벨 (왼쪽 고정)
        const labelDiv = document.createElement('div');
        labelDiv.className = 'horse-label';
        labelDiv.textContent = team.name;
        labelDiv.style.color = team.color;

        // 말 컨테이너
        const horseContainer = document.createElement('div');
        horseContainer.className = 'horse-wrapper';
        horseContainer.id = `horse-${team.id}`;
        horseContainer.style.position = 'absolute'; // 절대 위치로 설정

        // 말 이모지
        const horseDiv = document.createElement('div');
        horseDiv.className = 'horse';
        horseDiv.textContent = team.emoji;
        horseDiv.style.color = team.color;

        // 말 위에 팀 이름 표시
        const nameTag = document.createElement('div');
        nameTag.className = 'horse-name-tag';
        nameTag.id = `name-tag-${team.id}`;
        nameTag.textContent = team.name;
        nameTag.style.color = team.color;

        horseContainer.appendChild(nameTag);
        horseContainer.appendChild(horseDiv);

        laneDiv.appendChild(labelDiv);
        laneDiv.appendChild(horseContainer);
        horsesContainer.appendChild(laneDiv);
    });

    // 렌더링 후 위치 업데이트
    setTimeout(() => {
        gameState.teams.forEach((team, index) => {
            updateHorsePosition(team.id, gameState.currentPositions[index]);
        });
    }, 100);
}

// 컨트롤 패널 렌더링
function renderControls() {
    controlPanel.innerHTML = '';

    gameState.teams.forEach((team) => {
        const controlDiv = document.createElement('div');
        controlDiv.className = 'horse-control';

        // 마이너스 버튼
        const minusBtn = document.createElement('button');
        minusBtn.className = 'control-button minus';
        minusBtn.textContent = '-';
        minusBtn.onclick = () => moveHorse(team.id, -1);

        // 팀 정보 컨테이너
        const teamInfo = document.createElement('div');
        teamInfo.className = 'team-info';
        teamInfo.id = `team-info-${team.id}`;

        // 팀 이름 (편집 가능)
        const teamNameInput = document.createElement('input');
        teamNameInput.type = 'text';
        teamNameInput.className = 'team-name-input';
        teamNameInput.id = `team-name-input-${team.id}`;
        teamNameInput.value = team.name;
        teamNameInput.style.color = team.color;
        teamNameInput.onchange = () => updateTeamName(team.id, teamNameInput.value);
        teamNameInput.onkeyup = (e) => {
            if (e.key === 'Enter') {
                teamNameInput.blur();
            }
        };

        // 점수 표시
        const scoreSpan = document.createElement('span');
        scoreSpan.className = 'score-display';
        scoreSpan.id = `score-${team.id}`;
        scoreSpan.innerHTML = `${team.emoji} <small>${gameState.currentPositions[team.id]}점</small>`;
        scoreSpan.style.color = team.color;

        teamInfo.appendChild(teamNameInput);
        teamInfo.appendChild(scoreSpan);

        // 플러스 버튼
        const plusBtn = document.createElement('button');
        plusBtn.className = 'control-button';
        plusBtn.textContent = '+';
        plusBtn.onclick = () => moveHorse(team.id, 1);

        controlDiv.appendChild(minusBtn);
        controlDiv.appendChild(teamInfo);
        controlDiv.appendChild(plusBtn);
        controlPanel.appendChild(controlDiv);
    });
}

// 말 이동 함수
function moveHorse(teamId, direction) {
    const currentPos = gameState.currentPositions[teamId];
    let newPos = currentPos + direction;

    gameState.currentPositions[teamId] = newPos;

    // 말 위치 업데이트
    updateHorsePosition(teamId, newPos);

    // 점수 표시 업데이트
    updateScoreDisplay(teamId, newPos);

    // 트랙 범위 확장 체크
    checkAndExpandTrack();

    // 상태 저장
    saveGameState();
}

// 말 위치 업데이트
function updateHorsePosition(teamId, position) {
    const horseWrapper = document.getElementById(`horse-${teamId}`);
    if (horseWrapper) {
        const range = getCurrentRange();

        // 고정된 픽셀 간격으로 위치 계산 (최소값 기준으로 offset 적용)
        const leftPosition = (position - range.min) * gameState.pixelsPerPoint;

        horseWrapper.style.left = `${leftPosition}px`;

        // 말 이모지에 transform 적용
        const horseEmoji = horseWrapper.querySelector('.horse');
        if (horseEmoji) {
            horseEmoji.style.transform = 'scaleX(-1)'; // 오른쪽 방향 유지
        }

        // 애니메이션 효과
        horseWrapper.style.transition = 'left 0.5s ease';

        // 자동 스크롤 제거 - 사용자가 직접 드래그해서 볼 수 있도록
    }
}

// 점수 표시 업데이트
function updateScoreDisplay(teamId, score) {
    const scoreElement = document.getElementById(`score-${teamId}`);
    const team = gameState.teams[teamId];
    if (scoreElement) {
        let scoreText = score > 0 ? `+${score}` : `${score}`;
        scoreElement.innerHTML = `${team.emoji} <small>${scoreText}점</small>`;
    }
}

// 팀 이름 업데이트
function updateTeamName(teamId, newName) {
    if (!newName || newName.trim() === '') {
        newName = `팀 ${teamId + 1}`;
    }

    // 상태 업데이트
    gameState.teams[teamId].name = newName.trim();

    // 화면의 모든 팀 이름 표시 업데이트
    const horseLabel = document.querySelector(`.horse-lane:nth-child(${teamId + 1}) .horse-label`);
    if (horseLabel) {
        horseLabel.textContent = gameState.teams[teamId].name;
    }

    const nameTag = document.getElementById(`name-tag-${teamId}`);
    if (nameTag) {
        nameTag.textContent = gameState.teams[teamId].name;
    }

    // 상태 저장
    saveGameState();
}

// 현재 점수 범위 가져오기
function getCurrentRange() {
    const minScore = Math.min(...gameState.currentPositions, -5);
    const maxScore = Math.max(...gameState.currentPositions, 30);

    return {
        min: Math.floor(minScore / 10) * 10 - 10,  // 10점 단위로 여유 있게
        max: Math.ceil(maxScore / 10) * 10 + 10
    };
}

// 트랙 범위 확장 체크 및 업데이트
function checkAndExpandTrack() {
    const range = getCurrentRange();

    // 점수 표시 영역 업데이트
    updateScoreLabels(range.min, range.max);

    // 트랙 라인 업데이트
    updateTrackLines(range.min, range.max);

    // 모든 말 위치 재조정
    gameState.teams.forEach((team) => {
        updateHorsePosition(team.id, gameState.currentPositions[team.id]);
    });
}

// 점수 레이블 업데이트
function updateScoreLabels(min, max) {
    const scoreLine = document.querySelector('.score-line');
    const scoreDisplay = document.getElementById('score-display');
    scoreLine.innerHTML = '';

    const totalWidth = (max - min) * gameState.pixelsPerPoint;
    scoreDisplay.style.width = `${totalWidth}px`;
    scoreLine.style.width = `${totalWidth}px`;

    for (let i = min; i <= max; i++) {
        const label = document.createElement('span');
        label.className = 'score-label';

        if (i < 0) {
            label.className += ' negative';
            label.textContent = i.toString();
        } else if (i === 0) {
            label.className += ' zero';
            label.textContent = '0';
        } else {
            label.className += ' positive';
            label.textContent = '+' + i;
        }

        // 5점 단위 강조
        if (i !== 0 && i % 5 === 0) {
            label.style.fontWeight = '900';
            label.style.fontSize = '1em';
        }

        // 고정된 위치 설정
        label.style.left = `${(i - min) * gameState.pixelsPerPoint}px`;

        scoreLine.appendChild(label);
    }
}

// 트랙 라인 업데이트
function updateTrackLines(min, max) {
    const trackLines = document.querySelector('.track-lines');
    const raceTrack = document.getElementById('race-track');
    trackLines.innerHTML = '';

    const totalWidth = (max - min) * gameState.pixelsPerPoint;
    raceTrack.style.width = `${totalWidth}px`;
    trackLines.style.width = `${totalWidth}px`;

    for (let i = min; i <= max; i++) {
        const line = document.createElement('div');
        line.className = 'track-line';
        line.setAttribute('data-position', i.toString());

        if (i === 0) {
            line.className += ' zero';
        } else if (i % 5 === 0) {
            line.className += ' major';
        }

        // 고정된 위치 설정
        line.style.left = `${(i - min) * gameState.pixelsPerPoint}px`;

        trackLines.appendChild(line);
    }
}

// 자동 스크롤 함수
function autoScrollToPosition(position, minScore) {
    const scrollContainer = document.getElementById('track-scroll-container');
    const targetScroll = (position - minScore) * gameState.pixelsPerPoint;
    const containerWidth = scrollContainer.clientWidth;

    // 화면 중앙에 위치시키기
    const scrollPosition = targetScroll - containerWidth / 2;

    // 부드러운 스크롤
    scrollContainer.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: 'smooth'
    });
}

// 게임 리셋
function resetGame() {
    // 완전 초기화 확인
    if (confirm('현재 게임을 초기화하시겠습니까?\n모든 점수가 0으로 리셋됩니다.')) {
        // 모든 위치 0으로 리셋
        gameState.currentPositions = gameState.currentPositions.map(() => 0);

        // 화면 재렌더링
        if (gameScreen.classList.contains('active')) {
            // 트랙 범위 재설정
            checkAndExpandTrack();
            // 모든 말 위치 0으로 리셋
            gameState.teams.forEach((team) => {
                updateHorsePosition(team.id, 0);
                updateScoreDisplay(team.id, 0);
            });

            // 스크롤 위치를 -1이 맨 왼쪽에 오도록 리셋
            const scrollContainer = document.getElementById('track-scroll-container');
            const range = getCurrentRange();
            const targetPosition = (-1 - range.min) * gameState.pixelsPerPoint;
            scrollContainer.scrollTo({
                left: targetPosition,
                behavior: 'smooth'
            });

            // 상태 저장
            saveGameState();
        }
    }
}

// 완전 새 게임 (설정 화면으로)
function newGame() {
    if (confirm('새 게임을 시작하시겠습니까?\n현재 게임 데이터가 모두 삭제됩니다.')) {
        gameState.isGameActive = false;
        localStorage.removeItem(STORAGE_KEY);

        // 설정 화면으로 돌아가기
        gameScreen.classList.remove('active');
        setupScreen.classList.add('active');
    }
}

// localStorage에 게임 상태 저장
function saveGameState() {
    const scrollContainer = document.getElementById('track-scroll-container');
    const stateToSave = {
        ...gameState,
        scrollPosition: scrollContainer ? scrollContainer.scrollLeft : 0
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
}

// localStorage에서 게임 상태 불러오기
function loadGameState() {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
        try {
            const parsedState = JSON.parse(savedState);
            return parsedState;
        } catch (e) {
            console.error('저장된 게임 상태를 불러오는데 실패했습니다:', e);
            return null;
        }
    }
    return null;
}

// 게임 상태 복원
function restoreGameState(savedState) {
    gameState = {
        ...savedState,
        pixelsPerPoint: 50 // 픽셀 간격은 항상 고정
    };

    // 팀 개수 선택 복원
    teamCountSelect.value = gameState.teamCount;

    // 화면 전환
    setupScreen.classList.remove('active');
    gameScreen.classList.add('active');

    // 게임 화면 렌더링
    checkAndExpandTrack();
    renderHorses();
    renderControls();

    // 스크롤 위치 복원
    setTimeout(() => {
        const scrollContainer = document.getElementById('track-scroll-container');
        if (scrollContainer && savedState.scrollPosition) {
            scrollContainer.scrollLeft = savedState.scrollPosition;
        }
    }, 200);
}

// 키보드 단축키 지원 (Ctrl+R로 리셋만 지원)
document.addEventListener('keydown', (e) => {
    if (!gameScreen.classList.contains('active')) return;

    const key = e.key;

    // Ctrl+R키로 리셋
    if (key.toLowerCase() === 'r' && e.ctrlKey) {
        e.preventDefault();
        resetGame();
    }
});

// 페이지 로드 시 초기 상태 설정
window.addEventListener('load', () => {
    const savedState = loadGameState();
    if (savedState && savedState.isGameActive) {
        // 저장된 게임이 있으면 복원
        restoreGameState(savedState);
    } else {
        // 저장된 게임이 없으면 초기 화면
        setupScreen.classList.add('active');
    }
});

// 페이지 떠나기 전 상태 저장
window.addEventListener('beforeunload', () => {
    if (gameState.isGameActive) {
        saveGameState();
    }
});