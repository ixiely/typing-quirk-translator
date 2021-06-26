/**
  * @author: WillHayCode
  */

export type Character = {
    Character1: string;
    Character2: string;
    Character3: string;
}

export type UserSettings = {
    Character: Character;
    chKeys: Character[];
    enabled: boolean;
    stealthMode: boolean;
    highlight: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
    Character: {
        Character1: '',
        Character2: '',
        Character3: ''
    },
    chKeys: [{
        Character1: '',
        Character2: '',
        Character3: ''
    }],
    enabled: true,
    stealthMode: false,
    highlight: false,
};
