import { Resource } from "../RDFBase";
import { User } from "./User";
import { EventSubscription } from "../Events/Subscriptions/EventSubscription";
import BTTV from "../Emote/BTTVEmote";
import { StreamOnlineSubscription } from "../Events/Subscriptions/StreamOnlineSubscription";
import { LiveStream } from "../LiveStream";
import { StreamOfflineSubscription } from "../Events/Subscriptions/StreamOfflineSubscription";
import { StreamBlades } from "./ChatBot";

export class Streamer extends User {
    private tes: any;
    public bttv: BTTV;
    public livestream: LiveStream;

    constructor(userId: string, displayName?: string, tes?: any) {
        super(userId, displayName, "");
        this.userId = userId;
        this.addProperty("a", new Resource("Streamer"));
        this.bttv = new BTTV(this.userId);
        //this.checkLiveStream();
        this.tes = tes;
        this.subscribeToAllEvents();
    }

    private async checkLiveStream() {
        const response = await fetch(
            `https://api.twitch.tv/helix/streams?user_id=${this.userId}`,
            {
                headers: {
                    "Client-ID": process.env.TWITCH_CLIENT_ID,
                    Authorization: `Bearer ${StreamBlades.accessToken}`,
                },
            }
        );
        const data = await response.json();
        if (data.data.length > 0) {
            console.log(`${this.displayName} is live!`);
            this.livestream = new LiveStream(
                this,
                data.data[0].id,
                new Date(data.data[0].started_at)
            );
            this.livestream.semantize(`stream.online from ${this.displayName}`);
        } else {
            console.log(`${this.displayName} is offline!`);
            this.livestream = null;
        }
    }

    public async subscribe(event: EventSubscription): Promise<any> {
        if (!this.tes) return;
        try {
            const sub = await this.tes.subscribe(
                event.type,
                event.condition,
                event.version
            );
            await this.tes.on(event.type, event.callback);
            console.log(`Subscribed to ${event.type} for ${this.displayName}`);
            return sub;
        } catch (e) {
            console.error(this.userId, `(${this.displayName})`, event.type, e);
        }
    }

    public async unsubscribe(subscription: any): Promise<void> {
        if (!this.tes) return;
        await this.tes.unsubscribe(subscription);
    }

    private eventsSubscriptions: Record<string, EventSubscription> = {
        "stream.online": new StreamOnlineSubscription(this.userId, (data) => {
            this.livestream = new LiveStream(
                this,
                data.id,
                new Date(data.started_at)
            );
            this.livestream.semantize(
                `stream.online from ${data.broadcaster_user_name}`
            );
        }),
        "stream.offline": new StreamOfflineSubscription(this.userId, (data) => {
            this.livestream.finishStream();
            this.livestream.semantize(
                `stream.offline from ${data.broadcaster_user_name}`
            );
            this.livestream = null;
        }),
        /*"channel.chat.message": new MessageSubscription(
            this.userId,
            StreamBlades.userId,
            (data) => {
                new Message(this, data, this.bttv).semantize(
                    `channel.chat.message from ${data.chatter_user_name} to ${data.broadcaster_user_name}`
                );
            }
        ),*/
    };

    private subscribeToAllEvents() {
        for (const event in this.eventsSubscriptions) {
            this.subscribe(this.eventsSubscriptions[event]);
        }
    }

    public stop() {
        if (!this.tes) return;
        this.tes.disconnect();
        console.log(`Disconnected from ${this.displayName}`);
    }
}
