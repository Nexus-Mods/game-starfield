import {
  SignalDispatcher,
  SimpleEventDispatcher,
  EventDispatcher,
} from "strongly-typed-events";
import {
  IDeployedFile,
  IExtensionApi,
  IExtensionContext,
} from "vortex-api/lib/types/api";

export interface WillDeployEventArgs {
  profileId: string;
  oldDeployment: Record<string, IDeployedFile[]>;
}

/**
 * A wrapper class to strongly-type vortex events that are normally accessed via api.events.on
 * Events can be subscribed/unsubscribed to via .subscribe and .unsubscribe functions
 */
export class VortexEvents {
  private _onGameModeActivated = new EventDispatcher<
    IExtensionContext,
    string
  >();
  private _onWillDeploy = new EventDispatcher<
    IExtensionContext,
    WillDeployEventArgs
  >();
  //private _api:IExtensionApi;

  constructor(context: IExtensionContext) {
    //const _this = this;
    const _context = context;

    // listen for vortex event so we can refire
    context.api.events.on("gamemode-activated", async (gameMode: string) =>
      this._onGameModeActivated.dispatch(context, gameMode),
    );
    context.api.events.on(
      "will-deploy",
      async (
        profileId: string,
        oldDeployment: Record<string, IDeployedFile[]>,
      ) => this._onWillDeploy.dispatch(context, { profileId, oldDeployment }),
    );
  }

  public get onGameModeActivated() {
    return this._onGameModeActivated.asEvent();
  }

  public get onWillDeploy() {
    return this._onWillDeploy.asEvent();
  }
}
