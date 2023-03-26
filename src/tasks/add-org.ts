import { Job } from "agenda";
import { IOrganization } from "../database/models/organization";
import { agenda } from "./index";

// TODO; add the logic of evolving NFTs over here

agenda.define<IOrganization>("ADD_ORG", async (job: Job<IOrganization>) => {
  console.log(job);
});

export const addOrganization = (params: IOrganization) => {
  agenda.now("ADD_ORG", params);
};
