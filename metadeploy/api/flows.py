from cumulusci.core import flows


class BasicFlow(flows.BaseFlow):
    # TODO:
    # We'll want to subclass BaseFlow and add logic in the progress
    # callbacks to record and possibly push progress:
    # pre_flow, post_flow, pre_task, post_task, pre_subflow,
    # post_subflow
    pass


class PreflightFlow(flows.BaseFlow):
    pass

    # def pre_flow(self, *args, **kwargs):
    #     pass

    # def post_flow(self, *args, **kwargs):
    #     pass

    # def pre_task(self, *args, **kwargs):
    #     pass

    # def post_task(self, *args, **kwargs):
    #     pass

    # def pre_subflow(self, *args, **kwargs):
    #     pass

    # def post_subflow(self, *args, **kwargs):
    #     pass
