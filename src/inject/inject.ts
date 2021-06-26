import {UserSettings, DEFAULT_SETTINGS, Character} from '../types';
import {domAction} from './dom';

const cachedWords = new Map<string, string>();
let observer: MutationObserver = null;
let Character: Character = null;
let chKeys: Character[] = null;
let newWords: string[] = [];
let oldWords: string[] = [];
let revert = false;
let highlight: boolean;

export function start(settings: UserSettings = DEFAULT_SETTINGS) {
    cleanUp();
    if (!settings.enabled) {
        return;
    }
    highlight = settings.highlight;
    Character = settings.Character;
    chKeys = settings.chKeys;
    initalizeWords();
    replaceDOMWithNewWords();
}

function cleanUp() {
    if (newWords.length === 0 || oldWords.length === 0) {
        return;
    }
    observer && observer.disconnect();
    revert = true;
    [newWords, oldWords] = [oldWords, newWords];
    replaceDOMWithNewWords();
    [newWords, oldWords] = [oldWords, newWords];
    revert = false;
    cachedWords.clear();

}

function initalizeWords() {
    newWords = [];
    oldWords = [];
    const isCharacterCharacter1 = !!Character.Character1;
    const isCharacterCharacter2 = !!Character.Character2;
    const isCharacterCharacter3 = !!Character.Character3;
    for (let x = 0, len = chKeys.length; x < len; x++) {
        const isCharacterKeyCharacter1 = !!chKeys[x].Character1;
        const isCharacterKeyCharacter2 = !!chKeys[x].Character2;
        const isCharacterKeyCharacter3 = !!chKeys[x].Character3;
        if (
            isCharacterCharacter1 && isCharacterKeyCharacter1 &&
            isCharacterCharacter2 && isCharacterKeyCharacter2 &&
            isCharacterCharacter3 && isCharacterKeyCharacter3
        ) {
            const fullCharacter = `${Character.Character1} ${Character.Character2} ${Character.Character3}`;
            const fullchKey = `${chKeys[x].Character1} ${chKeys[x].Character2} ${chKeys[x].Character3}`;
            newWords.push(fullCharacter);
            oldWords.push(fullchKey);
        }

        if (isCharacterCharacter1 && isCharacterKeyCharacter1) {
            newWords.push(Character.Character1);
            oldWords.push(chKeys[x].Character1);
        }

        if (isCharacterCharacter2 && isCharacterKeyCharacter2) {
            newWords.push(isCharacterCharacter2 ? isCharacterCharacter2.Character2 : '');
            oldWords.push(chKeys[x].Character2);
        }

        if (isAliveNameLast && isDeadNameLast) {
            newWords.push(aliveName.last);
            oldWords.push(deadName[x].last);
        }

        if (
            isAliveNameFirst && isDeadNameFirst &&
            isAliveNameLast && isDeadNameLast
        ) {
            newWords.push(aliveName.first + aliveName.last);
            oldWords.push(deadName[x].first + deadName[x].last);
        }
    }
}

const acceptableCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_';

function replaceText(text: string, isTitle?: boolean) {
    let currentIndex = 0;
    let index: number, end: number;
    const getIndex = (searchString: string, position?: number) => index = text.toLowerCase().indexOf(searchString, position);
    const getNextIndex = (position: number) => {
        index = getIndex(oldWords[currentIndex], position);
        while (index === -1) {
            if (currentIndex + 1 === oldWords.length) {
                return false;
            } else {
                currentIndex++;
                index = getIndex(oldWords[currentIndex]);
            }
        }
        return true;
    };
    oldWords = oldWords.map(oldText => oldText.toLowerCase());
    if (highlight && !isTitle) {
        if (revert) {
            oldWords = oldWords.map(text => `<mark replaced="">${text}</mark>`);
        } else {
            newWords = newWords.map(text => `<mark replaced="">${text}</mark>`);
        }
    }
    const oldTextsLen = oldWords.map(word => word.length);
    while (getNextIndex(end)) {
        end = index + oldTextsLen[currentIndex];
        if (acceptableCharacters.indexOf(text[end]) === -1 && acceptableCharacters.indexOf(text[index - 1]) === -1) {
            text = text.substring(0, index) + newWords[currentIndex] + text.substring(end);
        }
    }
    return text;
}

function checkNodeForReplacement(node: Node) {
    if (!node || (!revert && node['replaced'])) {
        return;
    }
    if (revert) {
        if (highlight) {
            const cachedText = cachedWords.get((node as HTMLElement).innerHTML);
            if (cachedText) {
                (node as HTMLElement).innerHTML = cachedText.toString();
            }
        } else {
            const cachedText = cachedWords.get(node.nodeValue);
            if (cachedText) {
                node.parentElement && node.parentElement.replaceChild(document.createTextNode(cachedText.toString()), node);
            }
        }
        return;
    }
    if (node.nodeType === 3) {
        const oldText = node.nodeValue;
        let newText = node.nodeValue;
        newText = replaceText(newText, false);
        if (newText !== oldText) {
            cachedWords.set(newText, oldText);
            if (node.parentElement) {
                node.parentElement.innerHTML = newText;
            }
        }
    } else if (node.hasChildNodes()) {
        for (let i = 0, len = node.childNodes.length; i < len; i++) {
            checkNodeForReplacement(node.childNodes[i]);
        }
    }
}

function setupListener() {
    observer = new MutationObserver((mutations: Array<MutationRecord>) => {
        for (let i = 0, len = mutations.length; i < len; i++) {
            const mutation: MutationRecord = mutations[i];
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node: Node) => {
                    checkNodeForReplacement(node);
                });
            }
        }
    });
    observer.observe(document, {childList: true, subtree: true});
}

function checkElementForTextNodes() {
    if (revert && highlight) {
        const elements = document.body.querySelectorAll('mark[replaced]');
        for (let i = 0, len = elements.length; i < len; i++) {
            checkNodeForReplacement(elements[i].parentElement);
        }
    }
    const iterator = document.createNodeIterator(document.body, NodeFilter.SHOW_TEXT);
    let currentTextNode: Node;
    while ((currentTextNode = iterator.nextNode())) {
        checkNodeForReplacement(currentTextNode);
    }
    !revert && setupListener();
}

function replaceDOMWithNewWords() {
    document.title = replaceText(document.title, true);
    domAction(() => checkElementForTextNodes());
}
