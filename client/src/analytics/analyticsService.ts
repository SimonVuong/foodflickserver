
import amplitude from 'amplitude-js';
import { activeConfig } from '../config';
class AnalyticsService {

    private static _instance: AnalyticsService;

    private didInit: boolean = false;
    public static get Instance() {
        return this._instance || (this._instance = new this());
    }

    public async init(): Promise<void> {
        if (this.didInit) throw new Error('AnalyticsService aleady initialized');
        await amplitude.getInstance().init(activeConfig.analytics.key);
        this.didInit = true;
        return;
    }

    public async setUserId(userId: string): Promise<void> {
        this.throwIfNoInit();
        return amplitude.getInstance().setUserId(userId)
    }

    /**
     * 
     * @param properties custom map of properties
     */
    public async setUserProperties(properties: object): Promise<void> {
        this.throwIfNoInit();
        return amplitude.getInstance().setUserProperties(properties)
    }

    /**
     * @param eventName the event name
     * @param properties custom map of properties
     */
    public async trackEventWithProperties(eventName: string, properties: object): Promise<amplitude.LogReturn> {
        this.throwIfNoInit();
        return amplitude.getInstance().logEvent(eventName, properties);
    }

    /**
     * @param eventName the event name
     */
    public async trackEvent(eventName: string): Promise<amplitude.LogReturn> {
        this.throwIfNoInit();
        return amplitude.getInstance().logEvent(eventName)
    }

    // commented out since this is only available for enterprise amplitude
    // /**
    //  * @param groupType the type of group, ex: 'sports'
    //  * @param groupNames list of groups belonging to the groupType, ex: ['tennis', 'soccer']
    //  */
    // public async setGroup(groupType: string, groupNames: string[]): Promise<void> {
    //   this.throwIfNoInit();
    //   return Amplitude.setGroup(groupType, groupNames);
    // }

    private throwIfNoInit() {
        if (!this.didInit) throw new Error('AnalyiticsService not initialized. Initialize first with .init()');
    }
}

export default AnalyticsService.Instance;