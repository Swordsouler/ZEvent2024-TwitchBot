import { ne } from "@faker-js/faker";
import { Message } from "./Events/Message";
import { MessageData } from "./Events/Subscriptions/MessageSubscription";
import { StreamBlades } from "./Users/ChatBot";
import { Streamer } from "./Users/Streamer";
const TES = require("tesjs");
const tmi = require("tmi.js");

export class StreamerManager {
    private readonly streamersOffline: Record<string, string> = {
        AlphaCast: "94435040",
        AngleDroit: "177146919",
        AntoineDaniel: "135468063",
        AVAMind: "241808969",

        BagheraJones: "100744948",
        DamDamLive: "40729999",
        Doigby: "25454398",
        Domingo: "40063341",

        DrFeelgood: "38350595",
        Etoiles: "85800130",
        Gius: "75373669",
        Gom4rt: "149220653",

        helydia: "253195796",
        HortyUnderscore: "127129336",
        JLTomy: "155601320",
        Joueur_du_Grenier: "68078157",

        Kamet0: "27115917",
        KennyStream: "32183344",
        Laink: "89872865",
        Lapi: "44806759",

        LittleBigWhale: "121652526",
        mistermv: "28575692",
        MoMaN: "18887776",
        Mynthos: "28585164",

        OPcrotte: "133034596",
        Ponce: "50597026",
        Pressea: "469724446",
        Rivenzi: "32053915",

        Sakor_: "38284441",
        samueletienne: "505902512",
        Shisheyu: "62989856",
        Sundae: "36086436",

        Tonton: "72480716",
        Ultia: "68594999",
        ZeratoR: "41719107",
        ZEVENT: "77870741",

        ZEventPlays: "817065149",
    };

    private readonly streamersOnline: Record<string, string> = {
        "0uahleouff": "121954515",
        Anaee: "158851049",
        Areliann: "69592711",
        AsPig: "117848541",

        aypierre: "29753247",
        BARDINETTE: "87072436",
        BartGeo: "2305215",
        BenZaie: "4102418",

        Berlu: "96324761",
        Catboat: "154054375",
        Charles: "475763739",
        Chipsette: "16937718",

        Chreak: "42855324",
        CitronViolet: "41812776",
        Coffee: "176243295",
        Dhalen: "502281282",

        dofla: "74397555",
        Dokhy: "29315858",
        Elbe_Poly: "234217124",
        FantaBobShow: "29188740",

        FarodGames: "53226469",
        Flonflon: "468884133",
        Forsa: "27920057",
        Furax22: "120951864",

        FuuRy_Off: "117323707",
        haynetv: "117436348",
        Hctuan: "175560856",
        HeavenFox: "31997899",

        Hermanel: "61435362",
        Hugolisoir: "137573929",
        Humility: "84240904",
        IciJaponCorp: "766602965",

        iunanova: "517346449",
        JimmyBoyyy: "49035758",
        JOSPLAY: "58074830",
        Julgane: "87399830",

        JulietteArz: "124403155",
        KAOsvmd: "85876549",
        Karssi: "46887220",
        KEMIST_C10H15N: "71290640",

        kenbogard: "37523739",
        KyriaTV: "121542282",
        Laniyelle: "234558563",
        Laorie: "273221728",

        LaSAINTE: "675284287",
        lastbaroudeur: "196870264",
        LePotoMat: "596371111",
        LeVraiDoffy: "407902778",

        Linca: "144395004",
        Lu_K: "601706343",
        LuuxiA: "35632770",
        LyeGaia: "103824525",

        m4fgaming: "429600778",
        Malganyr: "82493955",
        Marco: "38978803",
        mehdi_scc: "244319274",

        MissCliick_: "160824044",
        Monodie: "138657790",
        Morrigh4n: "57934918",
        MrDeriv: "24538057",

        MrQuaRate: "89283616",
        MrTiboute: "41670870",
        NAROY: "152329729",
        Neagari: "464846470",

        Niniste: "51958193",
        OGN_EMPIRES: "43643204",
        Ouatdefok: "123930395",
        Peaxy: "38975140",

        PodaSai: "127826699",
        Poko: "53265819",
        PyrooTv: "90661740",
        Recalbox: "115060112",

        Redemption: "183215477",
        rhobalas_lol: "151874024",
        RoroowTV: "411206830",
        SAPEUH: "43993381",

        Saruei: "122863474",
        Scok: "84886230",
        Shynouh: "187531943",
        SieurPC: "497641799",

        Slipix: "89204267",
        Slyders_HS: "119356722",
        Sniper_Biscuit: "441936307",
        SolaryHS: "416031592",

        Sully_Game: "63071860",
        Sura: "94830708",
        Tatiana_TV: "655890726",
        TheGreatReview: "79233769",

        TheGuill84: "36318615",
        TheHolomovement: "107558788",
        TiTavion: "38822100",
        tpk_live: "167618935",

        Trinity: "40383341",
        TwincyTV: "440140011",
        Un33D: "50561208",
        Wingo: "41384425",

        Xari: "88301612",
        xo_trixy: "125323544",
        Zoltan: "125809135",
    };

    private _streamers: Record<string, string> = {};

    public get streamers(): Record<string, string> {
        return this._streamers;
    }

    public set streamers(value: Record<string, string>) {
        this._streamers = value;
    }

    private streamerList: Record<string, Streamer> = {};

    public async loadBroadcastersId(): Promise<void> {
        for (const streamer in this.streamers) {
            if (this.streamers[streamer] === "") {
                const id = await StreamBlades.getBroadcasterId(streamer);
                this.streamers[streamer] = id;
            }
        }
    }

    private chatClient: any;

    public async connectChat() {
        const channels = Object.keys(this.streamers);
        this.chatClient = new tmi.Client({
            options: { debug: false },
            connection: {
                reconnect: true,
                secure: true,
            },
            channels: channels,
        });
        this.chatClient.connect();
        this.chatClient.on("message", (channel, tags, message, self) => {
            // "Alca: Hello, World!"
            const streamer: Streamer = this.streamerList[tags["room-id"]];
            const broadcaster_name = channel.replace("#", "");
            const messageData: MessageData = {
                broadcaster_user_id: tags["room-id"],
                broadcaster_user_login: broadcaster_name,
                broadcaster_user_name: streamer.displayName,
                chatter_user_id: tags["user-id"],
                chatter_user_login: tags.username,
                chatter_user_name: tags["display-name"],
                message_id: tags.id,
                message: {
                    text: message,
                    fragments: message.split(" ").map((word) => {
                        if (tags.emotes) {
                            for (const emote in tags.emotes) {
                                const indexes = tags.emotes[emote];
                                const [start, end] = indexes[0].split("-");
                                if (
                                    parseInt(start) <= message.indexOf(word) &&
                                    message.indexOf(word) <= parseInt(end)
                                ) {
                                    return {
                                        type: "emote",
                                        text: word,
                                        emote: {
                                            id: emote,
                                        },
                                    };
                                }
                            }
                        }
                        return {
                            type: "text",
                            text: word,
                        };
                    }),
                },
                message_type: tags["message-type"],
                badges: tags.badges
                    ? Object.entries(tags.badges).map(([key, value]) => {
                          return {
                              set_id: key as string,
                              id: value as string,
                              info: ((tags["badge-info"] &&
                                  tags["badge-info"][key]) ??
                                  "") as string,
                          };
                      })
                    : [],
                color: tags.color,
            };
            new Message(streamer, messageData, streamer.bttv).semantize(
                `channel.chat.message from ${tags.username} to ${streamer.displayName}`
            );
        });
    }

    private tes: any;

    public async connect() {
        try {
            this.tes = new TES({
                identity: {
                    id: process.env.TWITCH_CLIENT_ID,
                    secret: process.env.TWITCH_CLIENT_SECRET,
                    accessToken: StreamBlades.accessToken,
                    refreshToken: StreamBlades.refreshToken,
                    onAuthenticationFailure: async () => {
                        return StreamBlades.accessToken;
                    },
                },
                listener: {
                    type: "websocket",
                },
                options: {
                    debug: false,
                    logging: false,
                },
            });
        } catch (e) {
            console.error(e);
        }
        const subscriptions = await this.tes.getSubscriptions();
        let count = 0;
        for (const subscription of await subscriptions["data"]) {
            if (subscription.status === "websocket_disconnected") {
                await this.tes.unsubscribe(subscription.id);
                count++;
            }
        }
        console.log(`Unsubscribed from ${count} disconnected subscriptions`);
    }

    constructor() {
        console.log("Waiting for StreamBlades to be ready");
        StreamBlades.OnReady(async () => {
            this._streamers = {
                ...this.streamersOffline,
                ...this.streamersOnline,
            };

            await this.loadBroadcastersId();
            console.log("Streamers loaded");
            console.log(this.streamers);
            console.log(`${Object.keys(this.streamers).length} streamers`);

            //await this.connect();
            this.connectChat();

            const delay = 100;
            let offset = 0;
            for (const streamer in this.streamers) {
                setTimeout(() => {
                    const streamerId = this.streamers[streamer];
                    const newStreamer = new Streamer(
                        streamerId,
                        streamer,
                        this.tes
                    );
                    this.streamerList[streamerId] = newStreamer;
                }, offset);
                offset += delay;
            }
            setTimeout(() => {
                if (!this.tes) return;
                this.tes.getSubscriptions().then((subs) => {
                    console.log(subs);
                });
            }, offset + 5000);
        });
    }
}
