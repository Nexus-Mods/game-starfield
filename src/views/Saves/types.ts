export interface ISaveGamePlugin {
  PluginName: string;
}
export interface ISaveGame {
  JsonVersion: number;
  Header: {
    EngineVersion: number;
    SaveVersion: number;
    SaveNumber: number;
    PlayerName: string;
    PlayerLevel: number;
    PlayerLocation: string;
    Playtime: string;
    RaceName: string;
    Gender: number;
    Experience: number;
    ExperienceRequired: number;
    DateTime: Date;
  };
  SaveVersion: number;
  CurrentGameVersion: string;
  CreatedGameVersion: string;
  PluginInfo: {
    PluginCount: number;
    LightPluginCount: number;
    MediumPluginCount: number;
    Plugins: ISaveGamePlugin[];
    LightPlugins: ISaveGamePlugin[];
    MediumPlugins: ISaveGamePlugin[];
  };
}

export interface ISaveList {
  [name: string]: ISaveGame;
}
