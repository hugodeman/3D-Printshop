import { H1, H2, H3, P } from "@/components/ui/Typography"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon";

export default function Page() {
    return (
        <div className="p-8 bg-black min-h-screen text-white">
            {/* Typography Examples */}
            <section className="mb-12">
                <H1>Welkom bij de 3D Printshop</H1>
                <H2>Dit is subtitel</H2>
                <H3>Dit is subtekst</H3>
                <P>Upload je model en bestel direct.</P>
                <H1 className={"text-contrast"}>Welkom bij de 3D Printshop</H1>
                <H2 className={"text-contrast"}>Dit is subtitel</H2>
                <H3 className={"text-contrast"}>Dit is subtekst</H3>
                <P className={"text-contrast"}>Upload je model en bestel direct.</P>
            </section>

            {/* Button Examples */}
            <section className="mb-12">
                <H2 className="mb-4">Buttons</H2>
                <div className="flex gap-4">
                    <Button variant={"primary"}>Bestel nu</Button>
                    <Button variant={"secondary"}>Bekijk onze diensten</Button>
                </div>
            </section>

            {/* Icon Examples */}
            <section>
                <H2 className="mb-8">Icon Voorbeelden</H2>
                
                {/* CAD/Design Icons */}
                <div className="mb-8">
                    <H3 className="mb-4">CAD & Design</H3>
                    <div className="flex gap-6 flex-wrap">
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="Box" size={32} opacity="50%"/>
                            <P className="text-xs">Box</P>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="Rocket" size={32} />
                            <P className="text-xs">Rocket</P>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="Ruler" size={32} />
                            <P className="text-xs">Ruler</P>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="Grid" size={32} />
                            <P className="text-xs">Grid</P>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="Sliders" size={32} />
                            <P className="text-xs">Sliders</P>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="MoveVertical" size={32} />
                            <P className="text-xs">Scroll</P>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="Mouse" size={32} />
                            <P className="text-xs">Mouse</P>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="MousePointerClick" size={32} />
                            <P className="text-xs">MousePointerClick</P>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="Eye" size={32} />
                            <P className="text-xs">Eye</P>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="Minus" size={32} />
                            <P className="text-xs">Minus</P>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="SquareChevronUp" size={32} />
                            <P className="text-xs">SquareChevronUp</P>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="Network" size={32} />
                            <P className="text-xs">Network</P>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="CircleCheck" size={32} />
                            <P className="text-xs">CircleCheck</P>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="Info" size={32} />
                            <P className="text-xs">Info</P>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="CircleQuestionMark" size={32} />
                            <P className="text-xs">CircleQuestionMark</P>
                        </div>
                    </div>
                </div>

                {/* Navigation Icons */}
                <div className="mb-8">
                    <H3 className="mb-4">Navigatie</H3>
                    <div className="flex gap-6 flex-wrap">
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="ArrowBigRight" size={32} />
                            <P className="text-xs">ArrowBigRight</P>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="ArrowBigLeft" size={32} />
                            <P className="text-xs">ArrowBigLeft</P>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="ArrowLeftRight" size={32} />
                            <P className="text-xs">ArrowLeftRight</P>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="Search" size={32} />
                            <P className="text-xs">Search</P>
                        </div>
                    </div>
                </div>

                {/* Product/Shop Icons */}
                <div className="mb-8">
                    <H3 className="mb-4">Shop</H3>
                    <div className="flex gap-6 flex-wrap">
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="ShoppingCart" size={32} />
                            <P className="text-xs">ShoppingCart</P>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="ShoppingBag" size={32} />
                            <P className="text-xs">ShoppingBag</P>
                        </div>
                    </div>
                </div>

                {/* File Upload Icons */}
                <div className="mb-8">
                    <H3 className="mb-4">Bestanden</H3>
                    <div className="flex gap-6 flex-wrap">
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="Upload" size={32} />
                            <P className="text-xs">Upload</P>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="Download" size={32} />
                            <P className="text-xs">Download</P>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="Image" size={32} />
                            <P className="text-xs">Image</P>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="Trash2" size={32} />
                            <P className="text-xs">Trash</P>
                        </div>
                    </div>
                </div>

                {/* Status Icons */}
                <div className="mb-8">
                    <H3 className="mb-4">Status</H3>
                    <div className="flex gap-6 flex-wrap">
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="Check" size={32} color="#98CEAA" />
                            <P className="text-xs">Check</P>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="Circle" size={32} />
                            <P className="text-xs">Circle</P>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="CircleDot" size={32} />
                            <P className="text-xs">CircleDot</P>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="X" size={32} color="#ff6b6b" />
                            <P className="text-xs">Cross</P>
                        </div>
                    </div>
                </div>

                {/* Time Icons */}
                <div className="mb-8">
                    <H3 className="mb-4">Tijd</H3>
                    <div className="flex gap-6 flex-wrap">
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="Clock" size={32} />
                            <P className="text-xs">Clock</P>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="Hourglass" size={32} />
                            <P className="text-xs">Hourglass</P>
                        </div>
                    </div>
                </div>

                {/* User/Account Icons */}
                <div className="mb-8">
                    <H3 className="mb-4">Account</H3>
                    <div className="flex gap-6 flex-wrap">
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="CircleUserRound" size={32} />
                            <P className="text-xs">User</P>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="LogOut" size={32} />
                            <P className="text-xs">LogOut</P>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="Mail" size={32} />
                            <P className="text-xs">Mail</P>
                        </div>
                    </div>
                </div>

                {/* Action Icons */}
                <div className="mb-8">
                    <H3 className="mb-4">Acties</H3>
                    <div className="flex gap-6 flex-wrap">
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="ThumbsUp" size={32}/>
                            <P className="text-xs">ThumbsUp</P>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="ThumbsDown" size={32}/>
                            <P className="text-xs">ThumbsDown</P>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="Cookie" size={32}/>
                            <P className="text-xs">Cookie</P>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="PenTool" size={32}/>
                            <P className="text-xs">PenTool</P>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="SquarePen" size={32}/>
                            <P className="text-xs">SquarePen</P>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="FilePlus" size={32}/>
                            <P className="text-xs">FilePlus</P>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Icon name="ScrollText" size={32}/>
                            <P className="text-xs">ScrollText</P>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}