import {Combination} from "@/models/Combinations";
import {User} from "@/models/User";

export type Choice = {
    combination: Combination | null,
    user: User | null,
}