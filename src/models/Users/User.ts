import { RDFBase, Resource, XSDData } from "../RDFBase";

export class User extends RDFBase {
    public userId: string;
    public displayName: string;
    public accessToken: string;
    public refreshToken: string;
    protected get ready(): boolean {
        return !!this.accessToken;
    }
    private refreshTimeout: NodeJS.Timeout;

    constructor(userId: string, displayName?: string, refreshToken?: string) {
        if (!userId) {
            userId = "anonymous_user";
            displayName = "Anonymous";
        }
        super(new Resource("twitch_" + userId));
        this.userId = userId;
        this.displayName = displayName;
        if (this.displayName)
            this.addProperty(
                new Resource("hasDisplayName"),
                new XSDData(this.displayName, "string")
            );
        this.refreshToken = refreshToken;
        if (!this.refreshToken) return;
        const load = async () => {
            await this.refreshAccessToken();
            if (!this.ready) {
                console.error(`Failed to load user ${this.userId}.`);
                return;
            }
            if (!this.displayName) await this.loadDisplayName();
            this.onReady();
        };
        load();
    }

    protected onReady(): void {
        if (this.displayName)
            this.addProperty(
                new Resource("hasDisplayName"),
                new XSDData(this.displayName, "string")
            );
    }

    public async refreshAccessToken(): Promise<string> {
        if (!this.refreshToken) return "";

        const response = await fetch("https://id.twitch.tv/oauth2/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                grant_type: "refresh_token",
                refresh_token: this.refreshToken,
                client_id: process.env.TWITCH_CLIENT_ID,
                client_secret: process.env.TWITCH_CLIENT_SECRET,
            }),
        });
        if (!response.ok) {
            const data = await response.json();
            console.error(
                `Failed to refresh access token for user ${this.userId}`,
                data
            );
            return "";
        }
        const data = await response.json();
        this.accessToken = data.access_token;
        clearTimeout(this.refreshTimeout);
        this.refreshTimeout = setTimeout(
            this.refreshAccessToken,
            data.expires_in * 1000
        );
        return this.accessToken;
    }

    protected async loadDisplayName(): Promise<void> {
        if (this.displayName) return;
        if (!this.ready) {
            console.error(
                `Failed to load display name for user ${this.userId} because the user is not ready.`
            );
            return;
        }

        const response = await fetch(
            `https://api.twitch.tv/helix/users?id=${this.userId}`,
            {
                headers: {
                    "Client-ID": process.env.TWITCH_CLIENT_ID,
                    Authorization: `Bearer ${this.accessToken}`,
                },
            }
        );
        if (!response.ok) {
            const data = await response.json();
            console.error(
                `Failed to load display name for user ${this.userId}`,
                data
            );
            return;
        }
        const data = await response.json();
        this.displayName = data.data[0].display_name;
    }
}
