import { Container } from "@components/container";
import { MetaTags } from "@components/meta";
import { SettingsSidebar } from "@components/sidebars/settings";
import { outfit } from "@fonts";
import { readCookie } from "@helpers/cookie";
import { uploadFiles } from "@helpers/upload";
import useHydrateUserContext from "@hooks/hydrate/user";
import { useSetUser, useUser } from "@hooks/user";
import {
  Avatar,
  Button,
  FileButton,
  Group,
  Image,
  Loader,
  LoadingOverlay,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Tabs,
  Text,
  Textarea,
  TextInput,
  useMantineColorScheme,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { IconUpload, IconUsers, IconX } from "@tabler/icons";
import { useQuery } from "@tanstack/react-query";
import { profileImageRouteGenerator } from "@utils/profile";
import { assetURLBuilder, URLBuilder } from "@utils/url";
import axios from "axios";
import clsx from "clsx";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Countries } from "~/constants";
import dynamic from "next/dynamic";

const NumberPicker = dynamic(() => import("react-phone-input-2"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

function Settings() {
  useHydrateUserContext("replace", true, "/auth/login");
  const [activeTab, setActiveTab] = useState("account");
  const { push, query, isReady } = useRouter();
  const { username } = useUser();
  const [profileCompleted, setProfileCompleted] = useState(false);
  const dispatch = useSetUser();
  const { data, error, refetch, isLoading } = useQuery<{
    bio: string;
    aboutMe: string;
    country: string;
    avatarUrl: string;
  }>({
    queryKey: ["account"],
    queryFn: async () => {
      return await fetch(URLBuilder(`/profile/${username}/authenticated`), {
        headers: {
          authorization: `Bearer ${readCookie("token")}`,
        },
      }).then((res) => res.json());
    },
    refetchInterval: false,
    enabled: isReady,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const formState = useForm({
    initialValues: {
      bio: "",
      aboutMe: "",
      country: "",
      avatarUrl: "",
      imageSelected: false,
    },
  });

  const [avatar, setAvatar] = useState<File | undefined>(undefined);

  useEffect(() => {
    if (!isLoading) {
      formState.setValues({
        bio: data!.bio,
        aboutMe: data!.aboutMe,
        country: data!.country,
        avatarUrl: data!.avatarUrl,
      });
      formState.resetDirty();
    }
  }, [data, isLoading]);
  const [kycDocuments, setKycDocuments] = useState<File[]>([]);
  const completeProfileState = useForm({
    initialValues: {
      mobileNumber: "",
    },
  });

  useEffect(() => {
    if (!isReady) return;
    const controller = new AbortController();
    const token = readCookie("token")!;
    axios
      .get(URLBuilder(`/profile/${username}/completed`), {
        headers: {
          authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      })
      .then((d) => d.data)
      .then((d) => setProfileCompleted(d.completed))
      .catch(() => null);
    return () => controller.abort();
  }, [isReady]);

  const { colorScheme } = useMantineColorScheme();
  const [loading, setLoading] = useState(false);
  return (
    <div className="flex flex-row ">
      <MetaTags description="Settings" title="Settings" />
      <aside>
        <SettingsSidebar setActiveTab={setActiveTab} />
      </aside>
      <div className="mt-20 px-4 flex-1">
        <Tabs
          classNames={{
            tabsList: "hidden",
          }}
          value={(query.activeTab as string) || "account"}
          onTabChange={(value) => push(`/settings?activeTab=${value}`)}
        >
          <Tabs.List>
            <Tabs.Tab value="account" icon={<IconUsers />}>
              Accounts
            </Tabs.Tab>
            <Tabs.Tab value="complete-profile">Complete Profile</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="account">
            <Container
              className={clsx("", {
                [outfit.className]: true,
              })}
            >
              <LoadingOverlay visible={isLoading} overlayBlur={2} />
              {isLoading ? (
                <Loader />
              ) : error ? (
                <div>error</div>
              ) : (
                <>
                  {data ? (
                    <div className="flex flex-col items-center justify-center">
                      <FileButton
                        onChange={(d) => {
                          if (d) {
                            setAvatar(d);
                            formState.setFieldValue("imageSelected", true);
                          }
                        }}
                      >
                        {(props) => (
                          <Avatar
                            src={
                              formState.values.imageSelected && avatar
                                ? URL.createObjectURL(avatar)
                                : formState.values.avatarUrl
                                ? assetURLBuilder(formState.values.avatarUrl)
                                : profileImageRouteGenerator(username)
                            }
                            size={150}
                            className={clsx("cursor-pointer")}
                            radius={"50%" as any}
                            onClick={props.onClick}
                          />
                        )}
                      </FileButton>
                      <span
                        className={clsx("text-md leading-[18px] mt-3", {
                          "text-gray-500": colorScheme === "dark",
                          "text-[#666666]": colorScheme === "light",
                        })}
                      >
                        @{username}
                      </span>
                      <form
                        onSubmit={formState.onSubmit(async (d) => {
                          setLoading(true);
                          let url: string | undefined = undefined;
                          if (avatar) {
                            const urls = await uploadFiles(
                              [avatar],
                              readCookie("token")!
                            ).catch((err) => {
                              showNotification({
                                message:
                                  err?.response?.data?.message ||
                                  "Something went wrong",
                                color: "red",
                              });
                              return null;
                            });
                            if (urls === null) return;
                            url = urls.data.paths[0];
                          }

                          axios
                            .post(
                              URLBuilder("/profile/update"),
                              {
                                bio: d.bio || undefined,
                                aboutMe: d.aboutMe || undefined,
                                country: d.country || undefined,
                                avatarUrl: url || d.avatarUrl || undefined,
                              },
                              {
                                headers: {
                                  authorization: `Bearer ${readCookie(
                                    "token"
                                  )}`,
                                },
                              }
                            )
                            .then(() => {
                              showNotification({
                                message: "Profile updated",
                                color: "green",
                              });
                              formState.resetDirty();
                              setAvatar(undefined);
                            })
                            .catch((err) => {
                              showNotification({
                                message:
                                  err?.response?.data?.message ||
                                  "Something went wrong",
                                color: "red",
                              });
                              return null;
                            })
                            .finally(() => {
                              setLoading(false);
                            });
                        })}
                        className={clsx("w-full")}
                      >
                        <SimpleGrid cols={2}>
                          <TextInput
                            label="Bio"
                            placeholder="Bio"
                            {...formState.getInputProps("bio")}
                            labelProps={{
                              className: clsx({
                                [outfit.className]: true,
                              }),
                            }}
                            classNames={{
                              input: clsx("h-[44px]"),
                            }}
                          />
                          <Select
                            data={Countries}
                            label="Country"
                            labelProps={{
                              className: clsx({
                                [outfit.className]: true,
                              }),
                            }}
                            placeholder="Country"
                            {...formState.getInputProps("country")}
                          />
                        </SimpleGrid>
                        <Textarea
                          label="About me"
                          placeholder="About me"
                          {...formState.getInputProps("aboutMe")}
                          labelProps={{
                            className: clsx({
                              [outfit.className]: true,
                            }),
                          }}
                          autosize
                        />
                        {formState.isDirty() || avatar != undefined ? (
                          <>
                            <Group position="center">
                              <Button
                                type="submit"
                                mt="md"
                                color="black"
                                className={clsx("", {
                                  [outfit.className]: true,
                                  "bg-gray-900 hover:bg-black":
                                    colorScheme === "light",
                                  "bg-gradient-to-r from-[#3b82f6] to-[#2dd4bf] text-white":
                                    colorScheme === "dark",
                                })}
                                loading={loading}
                              >
                                Update
                              </Button>
                            </Group>
                          </>
                        ) : null}
                      </form>
                    </div>
                  ) : null}
                </>
              )}
            </Container>
          </Tabs.Panel>
          <Tabs.Panel value="complete-profile">
            <Container
              className={clsx("", {
                [outfit.className]: true,
              })}
            >
              {profileCompleted ? (
                <div>
                  {/* show a nice message saying profile completed, you can use all features */}
                  <div className="flex flex-col">
                    <Text
                      align="center"
                      className={clsx("text-xl font-bold leading-[18px] mt-3", {
                        [outfit.className]: true,
                      })}
                    >
                      Profile Completed
                    </Text>
                    <Text
                      align="left"
                      className={clsx("text-base leading-[18px] text-center mt-3", {
                        [outfit.className]: true,
                      })}
                    >
                      You can now use all features of the platform
                    </Text>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex flex-col">
                    <Text
                      align="center"
                      className={clsx("text-xl font-bold leading-[18px] mt-3", {
                        [outfit.className]: true,
                      })}
                    >
                      Complete Your Profile
                    </Text>
                    <Text
                      align="left"
                      className={clsx("text-base leading-[18px] mt-3", {
                        [outfit.className]: true,
                      })}
                    >
                      Kyc Documents
                    </Text>
                    <span className="text-sm mt-2 mb-8">
                      Please upload your kyc documents to complete your profile
                    </span>
                    <div className="flex flex-row gap-3 flex-wrap">
                      {kycDocuments.map((i, index) => (
                        <div
                          className="flex flex-col items-center justify-center gap-2"
                          key={index}
                        >
                          <div className="relative">
                            <Image
                              className="cursor-pointer rounded-md"
                              width={100}
                              height={100}
                              src={URL.createObjectURL(i)}
                              onClick={() => {
                                setKycDocuments((images) =>
                                  images.filter((_, i2) => i2 !== index)
                                );
                              }}
                              classNames={{
                                image: "object-cover  rounded-md",
                              }}
                            />
                            <div className="absolute top-0 right-0">
                              <Button
                                onClick={() => {
                                  setKycDocuments((images) =>
                                    images.filter((_, i2) => i2 !== index)
                                  );
                                }}
                                variant="filled"
                                compact
                                className={clsx(
                                  "p-0 rounded-full bg-red-500 hover:bg-red-500/90"
                                )}
                              >
                                <IconX />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col mt-8 w-full">
                      <FileButton
                        onChange={(i) => {
                          i = i.filter((i) => i.type.includes("image"));

                          setKycDocuments((im) => [...im, ...i]);
                        }}
                        multiple
                      >
                        {(props) => (
                          <>
                            <Paper
                              withBorder
                              p="md"
                              radius="md"
                              onClick={props.onClick}
                              className="max-w-fit cursor-pointer"
                            >
                              <div className="flex flex-col items-center justify-center">
                                <IconUpload className="w-16 h-16 text-gray-500" />
                                <Text className="text-gray-500">
                                  Upload Kyc Documents{" "}
                                </Text>
                              </div>
                            </Paper>
                          </>
                        )}
                      </FileButton>
                    </div>
                  </div>
                  <form
                    onSubmit={completeProfileState.onSubmit(async (d) => {
                      if (kycDocuments.length == 0) {
                        return showNotification({
                          color: "red",
                          message: "Please upload kyc documents",
                        });
                      }
                      const data = await uploadFiles(
                        kycDocuments,
                        readCookie("token")!
                      ).catch((er) => null);
                      if (!data) {
                        return showNotification({
                          color: "red",
                          message: "Error uploading files",
                        });
                      }

                      const urls = data.data.paths;
                      axios
                        .post(
                          URLBuilder("/profile/complete"),
                          {
                            mobileNumber: d.mobileNumber,
                            urls,
                          },
                          {
                            headers: {
                              authorization: `Bearer ${readCookie("token")}`,
                            },
                          }
                        )
                        .then((res) => {
                          showNotification({
                            color: "green",
                            message: "Profile completed successfully",
                          });
                          setProfileCompleted(true);
                          dispatch({
                            payload: {
                              profileCompleted: true,
                            },
                            type: "SET_USER",
                          });
                        })
                        .catch((err) => {
                          showNotification({
                            color: "red",
                            message:
                              err?.response?.data?.message ||
                              "Error completing profile",
                          });
                        });
                    })}
                  >
                    <div className="flex flex-col mt-8">
                      <Text>
                        Please enter your mobile number
                        <span className="text-red-500">*</span>
                      </Text>
                      <NumberPicker
                        onChange={(d, data, event, formattedValue) => {
                          console.log(formattedValue);
                          completeProfileState.setFieldValue(
                            "mobileNumber",
                            formattedValue
                          );
                        }}
                        country="in"
                        value={completeProfileState.values.mobileNumber}
                        placeholder="Mobile Number"
                        enableSearch
                        inputProps={{
                          required: true,
                        }}
                      />
                      <Button
                        type="submit"
                        mt="md"
                        color="black"
                        className={clsx("max-w-fit", {
                          [outfit.className]: true,
                          "bg-gray-900 hover:bg-black": colorScheme === "light",
                          "bg-gradient-to-r from-[#3b82f6] to-[#2dd4bf] text-white":
                            colorScheme === "dark",
                        })}
                      >
                        Submit
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </Container>
          </Tabs.Panel>
        </Tabs>
      </div>
    </div>
  );
}

export default Settings;
