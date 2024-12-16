import { Tag } from "../models/tag";


const tags: Tag[] = [
    {
        id: "1",
        name: "Personal",
        color: "#FF0000"
    },
    {
        id: "2",
        name: "Work",
        color: "#00FF00"
    },
    {
        id: "3",
        name: "Study",
        color: "#0000FF"
    }
]

export function getaAllTags  (): Promise<Tag[]> {

    return Promise.resolve(tags)

}