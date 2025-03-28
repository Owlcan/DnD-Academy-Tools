import { Person } from './person';

export class DungeonMaster extends Person {
    private experience: number;
    private campaignsRun: string[];

    constructor(id: string, name: string, experience: number = 0, campaignsRun: string[] = []) {
        super(id, name);
        this.experience = experience;
        this.campaignsRun = campaignsRun;
    }

    addCampaign(campaignName: string): void {
        this.campaignsRun.push(campaignName);
        this.experience += 1;
    }

    getExperience(): number {
        return this.experience;
    }

    getCampaignsRun(): string[] {
        return [...this.campaignsRun];
    }

    toJson(): object {
        return {
            ...super.toJson(),
            experience: this.experience,
            campaignsRun: this.campaignsRun
        };
    }
}