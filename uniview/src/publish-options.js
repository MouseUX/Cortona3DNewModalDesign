/**
 * <h3>Publishing options</h3>
 * 
 * @namespace Cortona3DSolo.uniview.options
 * @tutorial 80-options
 * @tutorial customization-publish-options
 * @tutorial customization-component-options
 * @prop {color} 2DHighLightColor=#00FF00 2D - Highlighted object
 * @prop {color} 2DSelectedColor=#FFFF00 2D - Selected object
 * @prop {number} 2DSelectedFillOpacity=80 2D - Selected object fill opacity
 * @prop {color} 3DBackgroundColor=#FFFFFF 3D - Background
 * @prop {list} 3DFramePosition Illustration position
 * - Auto
 * - Left
 * - Right
 * @prop {list} 3DFrameSize Illustration/Text windows size
 * - 0 - 0/100 (%)
 * - 30 - 30/70 (%)
 * - 40 - 40/60 (%)
 * - 50 - 50/50 (%)
 * - 60 - 60/40 (%)
 * - 70 - 70/30 (%)
 * - 80 - 80/20 (%)
 * - 90 - 90/10 (%)
 * - 100 - 100/0 (%)
 * @prop {color} [3DHoverColor=#808080] 3D - Hovered object color
 * @prop {color} 3DSelectedColor=#FFFF00 3D - Selected object
 * @prop {boolean} 3DStepsAutoBinding=true 3D - Steps auto binding
 * @prop {bool} [Activate2DOnLoad=false] Activate 2D view after loading
 * @prop {boolean} AllowCrossSectionTool=false 3D - Section plane
 * @prop {boolean} AllowMeasureTool=false 3D - Measurement tool
 * @prop {boolean} AllowSelectedObjectsExternal3DView=false 3D - Show selected objects in separate window
 * @prop {boolean} AutoNumbering=true Auto step numbering
 * @prop {boolean} AutoRepeat=false Auto repeat
 * @prop {list} BOMStyle=0 BOM style
 * - 1 - Collapsed
 * - 0 - Expanded
 * @prop {color} Background3DColor=#FFFFFF 3D - Background color
 * @prop {number} [BrightnessLevel=20] Brightness level for highlighting a 3D object
 * @prop {boolean} CancelExamAfterFailedStep=false Cancel Exam mode after failed step
 * @prop {color} [ContentBackgroundColor=#FFFFFF] Content Background Color
 * @prop {color} [ContentTextColor=#000000] Content Text Color
 * @prop {color} ContextMenuBackgroundColor=#FFFFFF Context menu background
 * @prop {list} CoordinateResolution=0 Coordinate precision
 * - 3 - 3 digits
 * - 4 - 4 digits
 * - 5 - 5 digits
 * - 0 - Full
 * @prop {boolean} CreateStepListFile=false Generate Step List File
 * @prop {string} [CustomCSSRules] Custom CSS rules
 * @prop {boolean} DITATopic Generate DITA topic
 * @prop {number} [DefaultFitFactorObject=50] The default factor value for fitting to the object
 * @prop {number} [DefaultFitFactorScene=95] The default factor value for fitting to the scene
 * @prop {boolean} DisableHTMLCreation=false
 * @prop {boolean} DisableHTMLTemplate=false
 * @prop {bool} [DisableMultipleSelections=false] Disable multiple item selection
 * @prop {bool} [DisableNavigation=false] Disable navigation
 * @prop {bool} [DisableTextSelection=false] Disable text selection
 * @prop {list} DocumentStyle=0 Document style
 * - 1 - Collapsed
 * - 0 - Expanded
 * @prop {boolean} Enable3DPartSelection=true Show Selection bar
 * @prop {boolean} EnableAutostop=false Autostop after each step
 * @prop {boolean} EnableDemoMode=true Enable Demo mode
 * @prop {boolean} EnableExamMode=true Enable Exam mode
 * @prop {boolean} EnableFailIndicator=true Enable test result indicator
 * @prop {boolean} EnableFitButton=true Enable fit button
 * @prop {bool} [EnableGhostItems=false] Enable items that are not activated on any IPC page
 * @prop {boolean} EnablePMI=true Enable PMI
 * @prop {boolean} EnablePartThumbnails=false Enable part thumbnails
 * @prop {bool} [EnableRWI3DSelection=false] Enable selection of 3D items
 * @prop {bool} [EnableSearch=false] Enable the ability to search on the page
 * @prop {bool} [EnableSpinAroundPickPoint=false] Enable spin around pick point
 * @prop {boolean} EnableStudyMode=true Enable Study mode
 * @prop {boolean} EnableWarnings=true Enable messages
 * @prop {bool} [EnableZoomScaleLimits=false] Enable zoom restrictions
 * @prop {bool} [EnableZoomToRotationCenter=false] Enable zooming to the center of rotation
 * @prop {boolean} EncodeRes=true Encode resources
 * @prop {timeout} [ExplosionTimeout=1000] Explosion timeout (ms)
 * @prop {boolean} GenerateThumbnails=false Generate thumbnails
 * @prop {color} [Gradient3DColor] 3D - Background Gradient Color
 * @prop {boolean} HideActions=false Hide actions
 * @prop {boolean} HideDocumentTab=false Hide Document tab
 * @prop {boolean} HideInstructionsTab=false Hide Instructions tab
 * @prop {boolean} HideParametersTab=false Hide Parameters tab
 * @prop {color} HighlightedStepColor=#FFEFD5 Highlighted step color
 * @prop {list} IllustrationType=0 Illustration type
 * - 0 - 2D and 3D
 * - 1 - 3D only
 * - 2 - 2D only
 * @prop {boolean} InitialAmbientOcclusion=false 3D - Ambient occlusion
 * @prop {boolean} InitialAntiAliasing=true 3D - Anti-aliasing
 * @prop {number} [InitialBackgroundObjectsRenderingMode=0] The initial background objects rendering mode: 0 - Default, 1 - X-ray, 2 - Translucent shell
 * @prop {bool} [InitialComment=false] The initial state of the 'Show inline comments' checkbox in the procedure publication
 * @prop {bool} [InitialContinuousMode=true] The initial state of the 'Continuous playback in the Demo mode' checkbox in the learning publication
 * @prop {bool} [InitialDirectHints=true] The initial state of the 'Enable direct hints in the Study mode' checkbox in the learning publication
 * @prop {bool} [InitialDisableAlertMessages=false] The initial state of the 'Disable alert messages' checkbox in the procedure publication
 * @prop {bool} [InitialDrawingDisplayMode=false] The initial state of the '2D Graphics' button in the catalog publication
 * @prop {bool} [InitialFreezeCamera=false] The initial state of the 'Freeze viewpoint' checkbox in the procedure publication
 * @prop {bool} [InitialFullTable=false] The initial state of the 'Full table' checkbox in the catalog publication
 * @prop {bool} [InitialHighlightParts=false] The initial state of the 'Enable extra-highlighting of parts in the Demo and Study modes' checkbox in the learning publication
 * @prop {bool} [InitialIgnoreTransparency=false] The initial state of the 'Ignore Transparency' button in the publication
 * @prop {bool} [InitialLocked=false] The initial state of the 'One step playback' checkbox in the procedure publication
 * @prop {number} [InitialMode=0] The initial mode in the RWI publication: 0 - Preview, 1 - Job
 * @prop {boolean} InitialNavigationCube=false 3D - Navigation cube
 * @prop {number} [InitialNavigationScheme=0] The initial navigation scheme variant: 0 - Default, 1 - Aircraft, 2 - Multiview projection
 * @prop {boolean} InitialOutlineHoveredObjects=false 3D - Outline hovered objects
 * @prop {bool} [InitialPMI=false] The initial state of the 'PMI' checkbox in the RWI publication
 * @prop {bool} [InitialPan=false] The initial state of the 'Pan' button in the training publication
 * @prop {number} [InitialPlaybackSpeed=1] The initial state of the 'Speed' switch in the procedure publication
 * @prop {list} InitialSceneLighting=0 3D - Scene lighting
 * - 0 - Default
 * - 1 - Scene lighting 1
 * - 2 - Scene lighting 2
 * - 3 - Scene lighting 3
 * - 4 - Scene lighting 4
 * - 5 - Scene lighting 5
 * - 6 - Scene lighting 6
 * @prop {bool} [InitialSelectedObjectsCenterRotation=false] The initial state of the 'Set center rotation to the selected objects center' option in the publication
 * @prop {bool} [InitialSelectedObjectsExternalView=false] The initial state of the external 3D view for the selected objects
 * @prop {list} InitialSelectionMode=0 3D - Selection mode
 * - 0 - Highlight with color
 * - 1 - X-ray selected objects
 * - 2 - Translucent shell
 * @prop {number} [InitialSheetTransitionRate=1] The initial state of the 'Transition animation rate' switch in the catalog publication
 * @prop {bool} [InitialShowAxes=true] The initial state of the 'Show Axes' button in the publication
 * @prop {bool} [InitialShowRotationCenter=false] The initial state of the 'Show/Hide Rotation Center' button in the publication
 * @prop {bool} [InitialShowSurfaceEdges=false] The initial state of the 'Show surface edges' checkbox/button in the publication
 * @prop {bool} [InitialSkipAnimation=false] The initial state of the 'Skip Animation' button in the catalog publication
 * @prop {bool} [InitialSpin=true] The initial state of the 'Spin' button in the training publication
 * @prop {bool} [InitialTransitionAnimationControl=false] The initial state of the 'Enable transition animation control' checkbox in the catalog publication
 * @prop {bool} [InitialZoom=false] The initial state of the 'Zoom' button in the training publication
 * @prop {string} [InternalPublicationsSettings] Options for internal publications in the book (JSON)
 * @prop {boolean} KeepSurfaceEdges=false 3D - Keep surface edges
 * @prop {bool} [LockDPLTableWidth=false] Locking the width of the DPL table
 * @prop {boolean} Manifest=false
 * @prop {color} MessageBodyBackgroundColor=#808080 Message window color
 * @prop {color} MessageBodyColor=#FFFFFF Message border color
 * @prop {color} MessageTextAreaBackgroundColor=#FFFFFF Message text area color
 * @prop {color} MessageTextAreaColor=#000000 Message text color
 * @prop {list} MessageTextAreaFontSize=Medium Message text area font size
 * - Largest
 * - Larger
 * - Medium
 * - Smaller
 * - Smallest
 * @prop {boolean} MuteAudioInExam=false Mute audio in Exam mode
 * @prop {boolean} OptionContinuous=true Continuous play in Demo mode
 * @prop {boolean} OptionFlashPartInDemo=false Enable extra-highlighting of parts in Demo and Study modes
 * @prop {boolean} OptionShowAlertBox=true Enable alert message box
 * @prop {boolean} OptionShowExpectedOperations=true Enable direct hints in Study mode
 * @prop {boolean} PDFPublish=false Generate PDF
 * @prop {color} PadsBackgroundColor=#F3F3F3 Text window - tabs background color
 * @prop {color} PadsTextColor=#000000 Text window - tabs color
 * @prop {number} [PlaybackSpeed=1] Playback Speed
 * @prop {string} PublicPath 3D viewer URL
 * @prop {string} PublicationSettings
 * @prop {boolean} RemoveEmptyColumns=false
 * @prop {boolean} RemoveSpace=false Remove extra formatting
 * @prop {boolean} S1000DRDFMetadata=false Generate RDF/DC metadata
 * @prop {list} SCORM=0 Format
 * - 0 - HTML
 * - 11 - ADL SCORM 2004 2nd edition
 * - 12 - ADL SCORM 2004 3rd edition
 * @prop {color} SelectedFrameColor=#FF8000 Selected segment color
 * @prop {color} SelectedHotspotColor=#00FF00 2D - Selected hotspot color
 * @prop {boolean} ShowAutostopBox=true Show autostop checkbox
 * @prop {boolean} ShowAxes=true 3D - Show axes
 * @prop {boolean} ShowFreezeCheckbox=true Show Freeze viewpoint checkbox
 * @prop {boolean} ShowMessagesBox=true Show Messages checkbox
 * @prop {boolean} ShowPMIBox=true Show PMI checkbox
 * @prop {boolean} ShowPrevNextButtons=true Show Previous & Next buttons
 * @prop {boolean} ShowSmoothControl=true Show Seek control
 * @prop {boolean} ShowSpeedSelection=true Show Speed control
 * @prop {bool} [ShowSurfaceEdges=true] Show the edges of the surface
 * @prop {boolean} ShowThrustLines=true 3D - Show explode lines
 * @prop {boolean} SimplifyFloats=false Simplify floating point numbers
 * @prop {boolean} SingleHTMLBundle=false Create single HTML bundle
 * @prop {boolean} StartAfterLoading=false Start after loading
 * @prop {boolean} StartAfterNavigate=false Auto playback procedure steps
 * @prop {color} SubHeadersBackgroundColor=#B0B0B0 Text window - subtitle background color
 * @prop {color} SubHeadersTextColor=#000000 Text window - subtitle color
 * @prop {boolean} TableAdaptiveQty=false Table - Adaptive quantity adjustment
 * @prop {color} TableBackgroundColor=#FFFFFF Table - Background
 * @prop {color} TableBackgroundColorHL=#C8E2E2 Table - Highlighted row background
 * @prop {color} TableBackgroundColorHLNotIll=#FFE4E1 Table - Highlighted and not illustrated row background
 * @prop {color} TableBackgroundColorSel=#EEEE00 Table - Selected row background
 * @prop {color} TableBorderColor=#808080 Text window - border color
 * @prop {color} TableColor=#000000 Text window - color
 * @prop {list} TableFontSize=Medium Text window - font size
 * - Largest
 * - Larger
 * - Medium
 * - Smaller
 * - Smallest
 * @prop {color} TableHeaderBackgroundColor=#FFFFFF Text window - title background color
 * @prop {color} TableHeaderColor=#000000 Text window - title color
 * @prop {color} TableInactiveTextColor=#808080 Table - Inactive row text
 * @prop {color} TableSelectedBackgroundColor Text window - selected background color
 * @prop {color} TableSelectedColor=#000000 Text window - selected color
 * @prop {color} TableTextColor=#000000 Table - Text
 * @prop {color} TableTextColorSel=#000000 Table - Selected row text color
 * @prop {number} ThumbnailSize=96 Thumbnail size
 * @prop {color} ToolbarBackgroundColor=#D6D3CF Toolbar background color
 * @prop {color} ToolbarColor=#000000 Toolbar color
 * @prop {handler} TooltipFormat Tooltip format
 * @prop {number} [TransitionRate=1] Transition animation rate
 * @prop {boolean} UpRight 3D - Keep camera upright
 * @prop {list} UrlTarget=_blank Open links in new window
 * - _blank - Yes
 * - _self - No
 * @prop {boolean} UseCompressedSVG=false
 * @prop {bool} [UseLegacy3DPartDrawAttention=false] Use a legacy method to highlight a 3D part in the procedure
 * @prop {list} UseMultimediaBundle=0 Multimedia bundle
 * - 0 - None
 * - 1 - Create multimedia bundle
 * - 2 - Use viewer bundle
 * @prop {bool} [UseProcedure3DButton=false] Use the 3D button at the procedure
 * @prop {boolean} UseSVGFilesOnly=false
 * @prop {boolean} UseShoppingCart=false Use shopping cart
 * @prop {list} UseViewerBundle=0 Viewer bundle
 * - 0 - None
 * - 1 - Solo
 * - 2 - iOS
 * - 3 - Solo+iOS
 * @prop {list} VRMLProfile=1 VRML profile
 * - 1 - Cortona3D standard
 * - 2 - Cortona3D mobile
 * - 3 - Strict VRML97
 * @prop {boolean} X3D=false Generate X3D
 * @prop {boolean} Zip=false Pack publication
 * @prop {bool} [disableStandardLocaleFile=false] Disable the standard locale file
 * @prop {bool} [dismissSystemMessage007=false] Dismiss system message no. 007
 * @prop {bool} [enableCustomLocaleFile=false] Include a custom locale file
 * @prop {string} [helpContent] HTML help content
 * @prop {string} [helpUrl] Help URL
 * @prop {list} iOSViewpointTransitionMode=0 iOS - Viewpoint transition mode
 * - 0 - Auto
 * - 1 - Legacy
 * - 2 - Orbicular
 * @prop {string} [logoSrc] The URL of the logo image

 */
