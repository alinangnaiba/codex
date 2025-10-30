export namespace dto {
	
	export class CodexProgressResponse {
	    codexId: number;
	    totalSections: number;
	    completedSections: number;
	    progressPercent: number;
	
	    static createFrom(source: any = {}) {
	        return new CodexProgressResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.codexId = source["codexId"];
	        this.totalSections = source["totalSections"];
	        this.completedSections = source["completedSections"];
	        this.progressPercent = source["progressPercent"];
	    }
	}
	export class CodexResponse {
	    id: number;
	    title: string;
	    description: string;
	    isPinned: boolean;
	    createdAt: string;
	    updatedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new CodexResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.description = source["description"];
	        this.isPinned = source["isPinned"];
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	    }
	}
	export class SectionResponse {
	    id: number;
	    codexId: number;
	    title: string;
	    filePath: string;
	    isComplete: boolean;
	    orderIndex: number;
	    createdAt: string;
	    updatedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new SectionResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.codexId = source["codexId"];
	        this.title = source["title"];
	        this.filePath = source["filePath"];
	        this.isComplete = source["isComplete"];
	        this.orderIndex = source["orderIndex"];
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	    }
	}
	export class CodexWithSectionsResponse {
	    id: number;
	    title: string;
	    description: string;
	    isPinned: boolean;
	    createdAt: string;
	    updatedAt: string;
	    sections: SectionResponse[];
	
	    static createFrom(source: any = {}) {
	        return new CodexWithSectionsResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.description = source["description"];
	        this.isPinned = source["isPinned"];
	        this.createdAt = source["createdAt"];
	        this.updatedAt = source["updatedAt"];
	        this.sections = this.convertValues(source["sections"], SectionResponse);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class GitHubStatusResponse {
	    initialized: boolean;
	    hasChanges: boolean;
	    changedFiles: string[];
	    lastSyncTime: string;
	    remoteURL: string;
	    branch: string;
	
	    static createFrom(source: any = {}) {
	        return new GitHubStatusResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.initialized = source["initialized"];
	        this.hasChanges = source["hasChanges"];
	        this.changedFiles = source["changedFiles"];
	        this.lastSyncTime = source["lastSyncTime"];
	        this.remoteURL = source["remoteURL"];
	        this.branch = source["branch"];
	    }
	}

}

