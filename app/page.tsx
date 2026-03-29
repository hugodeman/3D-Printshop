import { H1, H2, H3, P } from "@/components/ui/Typography"
import { Button } from "@/components/ui/Button"
export default function Page() {
    return (
        <div>
            <H1>Welkom bij de 3D Printshop</H1>
            <H2>Dit is subtitel</H2>
            <H3>Dit is subtekst</H3>
            <P>Upload je model en bestel direct.</P>
            <H1 className={"text-contrast"}>Welkom bij de 3D Printshop</H1>
            <H2 className={"text-contrast"}>Dit is subtitel</H2>
            <H3 className={"text-contrast"}>Dit is subtekst</H3>
            <P className={"text-contrast"}>Upload je model en bestel direct.</P>
            <Button variant={"primary"}>Bestel nu</Button>
            <Button variant={"secondary"}>Bekijk onze diensten</Button>
        </div>
    )
}